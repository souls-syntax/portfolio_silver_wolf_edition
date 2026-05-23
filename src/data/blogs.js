// ─── Blog Database ──────────────────────────────────────────────────────────
// This file IS the blog database. Add new posts/series here and git push.
// No backend required. Comments live in localStorage per post.
//
// Structure:
//   seriesId: string | null   — links chapters into a series
//   chapterIndex: number | null — order within the series (1-based)
//   tags: string[]            — used for filtering/search
//   content: string           — Markdown content
// ─────────────────────────────────────────────────────────────────────────────

export const SERIES = [
  {
    id: "systems-from-scratch",
    title: "Systems From Scratch",
    description: "Building low-level systems in C — from memory allocators to operating systems. A multi-part deep dive.",
    tags: ["C", "Systems", "OS"],
    chapterCount: 3,
  },
  {
    id: "zig-chronicles",
    title: "Zig Chronicles",
    description: "My journey learning Zig while building tsundere-runtime. Honest takes on a polarizing language.",
    tags: ["Zig", "Systems"],
    chapterCount: 2,
  },
];

export const BLOGS = [
  // ── Series: Systems From Scratch ──────────────────────────────────────────
  {
    id: "sfs-ch1-memory",
    title: "Memory Allocators: Why malloc() Is Lying to You",
    date: "2026-01-12",
    tags: ["C", "Systems", "Memory", "Series"],
    seriesId: "systems-from-scratch",
    chapterIndex: 1,
    excerpt: "malloc() isn't a magic free-resource machine. Let's rip it open and build our own arena allocator from scratch.",
    content: `# Memory Allocators: Why malloc() Is Lying to You

When I first started writing C seriously, I had a naive view of memory: you call \`malloc()\`, you get memory, you call \`free()\`, memory goes back. Simple.

Then I started building **C-STL** and everything I thought I knew collapsed.

## The Fragmentation Problem

Imagine your heap as a street of houses. Every time you \`malloc\`, you build a house. Every time you \`free\`, you demolish one. Sounds fine — until you need a mansion (a large contiguous allocation) but the street is full of empty lots that are too small individually.

That's **heap fragmentation**. And malloc can't do much about it.

## Arena Allocators: The Nuclear Option

An arena allocator says: *screw individual lifetimes*. Give me a huge slab of memory upfront, and I'll hand out slices. When I'm done with everything, I free the whole slab at once.

\`\`\`c
typedef struct {
    uint8_t *base;
    size_t   offset;
    size_t   capacity;
} Arena;

Arena arena_create(size_t capacity) {
    Arena a;
    a.base     = malloc(capacity);
    a.offset   = 0;
    a.capacity = capacity;
    return a;
}

void *arena_alloc(Arena *a, size_t size) {
    // align to 8 bytes
    size = (size + 7) & ~7;
    if (a->offset + size > a->capacity) return NULL;
    void *ptr = a->base + a->offset;
    a->offset += size;
    return ptr;
}

void arena_reset(Arena *a) {
    a->offset = 0; // instant "free" of everything
}
\`\`\`

No individual frees. No fragmentation. Reset in O(1).

## When To Use What

| Allocator | Use When |
|-----------|----------|
| \`malloc/free\` | Long-lived objects with independent lifetimes |
| Arena | Temporary batch work (parsing, per-frame game data) |
| Pool | Fixed-size objects allocated/freed frequently |
| Stack | You know the size at compile time |

## What This Taught Me

Building **C-STL** forced me to think about *ownership* at every level. In higher-level languages the GC handles this — in C, you ARE the GC.

Next chapter: we go deeper into how the OS actually gives us memory, and why sbrk() is deprecated.
`,
  },
  {
    id: "sfs-ch2-syscalls",
    title: "Syscalls: The Real malloc() Story",
    date: "2026-02-03",
    tags: ["C", "Systems", "Linux", "Kernel", "Series"],
    seriesId: "systems-from-scratch",
    chapterIndex: 2,
    excerpt: "malloc() calls mmap(). mmap() talks to the kernel. The kernel talks to physical hardware. Let's trace that whole call stack.",
    content: `# Syscalls: The Real malloc() Story

Last chapter we built an arena allocator on top of \`malloc()\`. But where does \`malloc()\` itself get its memory?

The answer is: **the kernel**. Via syscalls.

## sbrk() vs mmap()

Historically, \`malloc()\` used \`sbrk()\` — a syscall that extended the process's heap segment by moving the "program break" pointer.

Modern allocators (like glibc's ptmalloc) primarily use \`mmap()\`:

\`\`\`c
// Under the hood, a large malloc() does something like:
void *ptr = mmap(
    NULL,                    // let kernel choose address
    size,                    // how much memory
    PROT_READ | PROT_WRITE,  // readable and writable
    MAP_PRIVATE | MAP_ANONYMOUS, // not backed by a file
    -1,                      // no file descriptor
    0                        // no offset
);
\`\`\`

## Virtual vs Physical Memory

Here's the mind-bender: when you \`mmap()\` 1GB, you don't *actually* get 1GB of RAM immediately. The kernel just reserves virtual address space. Physical pages are only allocated when you first **access** each page.

This is why \`malloc(1000000000)\` can succeed on a machine with only 512MB of RAM — until you start writing to it.

\`\`\`c
char *p = malloc(1000000000); // "succeeds"
p[0] = 42;                    // page fault → kernel allocates physical page
\`\`\`

## Building Our Own mmap() Allocator

For **sauceOS**, I needed to implement my own physical memory manager. No glibc, no stdlib. Just me and the hardware.

The Limine bootloader gives you a memory map at boot — a list of available physical memory regions. From there you build a bitmap or buddy allocator to track which pages are in use.

\`\`\`c
// Physical memory map from Limine
struct limine_memmap_response *memmap = memmap_request.response;

for (size_t i = 0; i < memmap->entry_count; i++) {
    struct limine_memmap_entry *entry = memmap->entries[i];
    if (entry->type == LIMINE_MEMMAP_USABLE) {
        pmm_init_region(entry->base, entry->length);
    }
}
\`\`\`

Next up: paging, virtual memory, and why your process thinks it owns the whole address space.
`,
  },
  {
    id: "sfs-ch3-paging",
    title: "Paging: Why Every Process Thinks It Owns the World",
    date: "2026-03-15",
    tags: ["C", "Systems", "OS", "Memory", "Series"],
    seriesId: "systems-from-scratch",
    chapterIndex: 3,
    excerpt: "x86_64 virtual memory is a four-level illusion. Let's build the page tables for sauceOS and see why every process gets its own universe.",
    content: `# Paging: Why Every Process Thinks It Owns the World

If you've ever wondered why two different programs can both have a pointer to address \`0x7fff....\` that point to completely different data — the answer is **paging**.

## The Illusion

Every process on Linux (and sauceOS) lives in a **virtual address space** — a private 48-bit address range it thinks it owns entirely. The CPU translates virtual addresses to physical addresses using page tables, transparently.

## x86_64 Page Table Walk

On x86_64, virtual addresses are translated through 4 levels of page tables:

\`\`\`
Virtual Address (48 bits):
[  PML4 idx  |  PDPT idx  |  PD idx  |  PT idx  |  Page Offset ]
[  9 bits    |  9 bits    |  9 bits  |  9 bits  |  12 bits     ]
\`\`\`

Each level is a table of 512 entries (9 bits = 512). Each entry points to the next level, until the final Page Table entry points to the actual physical page.

\`\`\`c
// Setting up a page table entry in sauceOS
#define PTE_PRESENT  (1ULL << 0)
#define PTE_WRITABLE (1ULL << 1)
#define PTE_USER     (1ULL << 2)

static inline void map_page(
    uint64_t *pml4,
    uint64_t  virt,
    uint64_t  phys,
    uint64_t  flags
) {
    uint64_t pml4_idx = (virt >> 39) & 0x1FF;
    uint64_t pdpt_idx = (virt >> 30) & 0x1FF;
    uint64_t pd_idx   = (virt >> 21) & 0x1FF;
    uint64_t pt_idx   = (virt >> 12) & 0x1FF;

    // ... walk/create each level ...
    pt[pt_idx] = phys | flags | PTE_PRESENT;
}
\`\`\`

## Context Switching

When the OS switches between processes, it loads a different PML4 (root page table) into the \`CR3\` register. Instantly, all address translations use the new process's mappings. Zero copy, zero cost.

This is one of the most elegant designs in systems software.

## What Building sauceOS Taught Me

You don't truly understand your OS until you've had to write one. Every abstraction that seemed magical — malloc, fork, exec, mmap — becomes comprehensible once you've built the layer below it.

The best way to learn C isn't to read about it. It's to break things at the hardware level and figure out why.
`,
  },

  // ── Series: Zig Chronicles ─────────────────────────────────────────────────
  {
    id: "zig-ch1-first-impressions",
    title: "Zig First Impressions: C But Make It Honest",
    date: "2026-04-08",
    tags: ["Zig", "Systems", "Language Design", "Series"],
    seriesId: "zig-chronicles",
    chapterIndex: 1,
    excerpt: "Everyone says Zig is 'better C'. After 3 months of tsundere-runtime, here's my honest take — the good, the confusing, and the comptime.",
    content: `# Zig First Impressions: C But Make It Honest

Three months ago I started **tsundere-runtime** — a Zig project with the tagline *"Tsundere runtime loads baka binary"* (yes I'm a degenerate, yes I stand by it).

Here's what I actually think of Zig after living in it.

## What Zig Gets Right

### Explicit Allocators

In C, allocations happen in some black box. In Zig, you **pass the allocator**:

\`\`\`zig
const allocator = std.heap.page_allocator;
const buf = try allocator.alloc(u8, 1024);
defer allocator.free(buf);
\`\`\`

This makes it trivially easy to test with a \`FixedBufferAllocator\`, profile with a counting allocator, or catch leaks with a debug allocator. Beautiful.

### comptime

Zig's \`comptime\` is what C preprocessor macros wished they were:

\`\`\`zig
fn fibonacci(comptime n: u32) u32 {
    if (n < 2) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const fib10 = fibonacci(10); // evaluated at compile time
\`\`\`

The compiler just... runs your code at compile time. No template metaprogramming nightmares.

### No Hidden Control Flow

No operator overloading, no exceptions, no implicit conversions. What you write is what happens. The \`try\` keyword is explicit error propagation:

\`\`\`zig
const result = try someFunction(); // if error, return it to caller
\`\`\`

## What's Still Rough

The ecosystem is young. No mature async story. The standard library has gaps. Build system is powerful but the learning curve is steep.

Also: the Zig community's relationship with Bun and other high-profile Zig users is... complicated. But that's a drama post for another day.

## The Tsundere Runtime

The project itself is a minimal runtime for loading ELF binaries — think a tiny dynamic linker. Why? Because I wanted to understand how \`ld.so\` works and figured building one was the fastest path.

Turns out it was. Next chapter: what I learned about ELF format and why binary loading is terrifying.
`,
  },
  {
    id: "zig-ch2-elf",
    title: "ELF Loading: Teaching Zig to Load Itself",
    date: "2026-05-01",
    tags: ["Zig", "ELF", "Systems", "Linker", "Series"],
    seriesId: "zig-chronicles",
    chapterIndex: 2,
    excerpt: "ELF binaries aren't mysterious blobs — they're structured objects full of promises to the linker. tsundere-runtime is my attempt to honor those promises.",
    content: `# ELF Loading: Teaching Zig to Load Itself

The ELF (Executable and Linkable Format) file format is the universal binary format on Linux. Every program you run is ELF. Every shared library is ELF. Understanding it unlocks the entire runtime.

## ELF Anatomy

An ELF file has three main sections:
1. **ELF Header** — magic number, architecture, entry point
2. **Program Headers** — runtime loading instructions (segments)
3. **Section Headers** — static linking metadata (sections)

For loading, we care about **program headers**.

\`\`\`zig
const std = @import("std");

const Elf64_Phdr = extern struct {
    p_type:   u32,  // segment type
    p_flags:  u32,  // permissions
    p_offset: u64,  // offset in file
    p_vaddr:  u64,  // virtual address to load at
    p_paddr:  u64,  // physical address (usually same as vaddr)
    p_filesz: u64,  // size in file
    p_memsz:  u64,  // size in memory (>= filesz, difference is zero-filled)
    p_align:  u64,  // alignment requirement
};
\`\`\`

## The Loading Algorithm

Loading an ELF is simpler than it sounds:

1. Read the ELF header, verify magic (\`\\x7fELF\`)
2. For each PT_LOAD program header:
   - \`mmap()\` the segment at \`p_vaddr\` with the right permissions
   - Copy \`p_filesz\` bytes from the file at \`p_offset\`
   - Zero-fill \`p_memsz - p_filesz\` bytes (the BSS section)
3. Find the entry point from the ELF header
4. Set up the stack with \`argc\`, \`argv\`, \`envp\`, and the aux vector
5. Jump to the entry point

\`\`\`zig
fn load_elf(path: []const u8, allocator: std.mem.Allocator) !usize {
    const file = try std.fs.cwd().openFile(path, .{});
    defer file.close();

    var header: std.elf.Elf64_Ehdr = undefined;
    _ = try file.read(std.mem.asBytes(&header));

    if (!std.mem.eql(u8, header.e_ident[0..4], "\\x7fELF")) {
        return error.NotElf;
    }

    // Load PT_LOAD segments...
    return header.e_entry; // entry point
}
\`\`\`

## The Aux Vector: The Dark Secret

Nobody tells you about the aux vector. It's a list of key-value pairs passed on the stack to every new process, containing:
- The executable's load address
- System page size  
- Hardware capabilities
- The vDSO address

Get it wrong and \`libc\` segfaults in mysterious ways on startup. Ask me how I know.

## What's Next

tsundere-runtime can now load static ELF binaries. The next frontier is dynamic linking — handling \`.so\` files and the GOT/PLT trampoline. That rabbit hole goes deep.
`,
  },

  // ── Standalone Posts ───────────────────────────────────────────────────────
  {
    id: "sush-posix-shell",
    title: "Writing a POSIX Shell in C++: sush",
    date: "2026-02-28",
    tags: ["C++", "Shell", "Systems", "POSIX"],
    seriesId: null,
    chapterIndex: null,
    excerpt: "I wrote a minimal POSIX-compliant shell called sush (Simple User SHell). Here's what surprised me about how shells actually work.",
    content: `# Writing a POSIX Shell in C++: sush

sush (Simple User SHell) started as a weekend project and turned into a 2-month rabbit hole. Here's what I learned.

## The Shell Is Just a Loop

At its core, a shell is embarrassingly simple:

\`\`\`cpp
while (true) {
    std::string input = read_line();
    auto tokens = tokenize(input);
    auto ast = parse(tokens);
    execute(ast);
}
\`\`\`

The complexity is in the details.

## fork() + exec(): The UNIX Way

Every command you run in a shell creates a new process:

\`\`\`cpp
pid_t pid = fork();
if (pid == 0) {
    // Child process
    execvp(argv[0], argv);
    // If we get here, exec failed
    std::cerr << "exec failed: " << strerror(errno) << "\\n";
    exit(1);
} else {
    // Parent process — wait for child
    int status;
    waitpid(pid, &status, 0);
}
\`\`\`

\`fork()\` duplicates the entire process. \`exec()\` replaces the process image with a new program. The shell stays alive, the child becomes \`ls\` or \`grep\` or whatever.

## Pipes Are File Descriptors

\`\`\`
ls | grep .c | wc -l
\`\`\`

This creates a chain where stdout of each process connects to stdin of the next. In C:

\`\`\`cpp
int pipefd[2];
pipe(pipefd); // pipefd[0] = read end, pipefd[1] = write end

// In child 1 (ls):
dup2(pipefd[1], STDOUT_FILENO); // redirect stdout to write end
close(pipefd[0]);
close(pipefd[1]);
execvp("ls", ...);

// In child 2 (grep):
dup2(pipefd[0], STDIN_FILENO); // redirect stdin to read end
close(pipefd[0]);
close(pipefd[1]);
execvp("grep", ...);
\`\`\`

## Job Control: The Hardest Part

Handling \`Ctrl+Z\`, background jobs (\`&\`), and \`fg\`/\`bg\` is where POSIX compliance gets brutal. Signal handling, process groups, terminal ownership — it's a maze.

sush passes most of the POSIX test suite. The remaining failures are edge cases in heredoc handling and a couple of arithmetic expansion quirks.

## Was It Worth It?

Yes. I now understand every command I type in a shell at the syscall level. That's not something you get from reading docs.

The code is on [GitHub](https://github.com/souls-syntax/sush) if you want to read it.
`,
  },
  {
    id: "cuda-intro",
    title: "CUDA Isn't Magic: A GPU Programming Primer",
    date: "2026-04-22",
    tags: ["CUDA", "GPU", "C", "Performance"],
    seriesId: null,
    chapterIndex: null,
    excerpt: "CUDA is GPU programming for people who don't like magic. Here's the mental model that finally made it click for me.",
    content: `# CUDA Isn't Magic: A GPU Programming Primer

My bio says "I do C and CUDA". Here's what that actually means.

## The GPU Mental Model

A CPU has ~16 powerful cores optimized for sequential logic. A GPU has **thousands** of small cores optimized for parallel math.

The paradigm shift: instead of "do this thing N times sequentially", you write a **kernel** — a function that runs simultaneously on N threads.

## Hello, CUDA

\`\`\`cuda
// GPU kernel — runs on N threads simultaneously
__global__ void vector_add(float *a, float *b, float *c, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        c[idx] = a[idx] + b[idx];
    }
}

int main() {
    const int N = 1 << 20; // 1M elements
    float *d_a, *d_b, *d_c;

    // Allocate on GPU
    cudaMalloc(&d_a, N * sizeof(float));
    cudaMalloc(&d_b, N * sizeof(float));
    cudaMalloc(&d_c, N * sizeof(float));

    // Copy data to GPU
    cudaMemcpy(d_a, h_a, N * sizeof(float), cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, h_b, N * sizeof(float), cudaMemcpyHostToDevice);

    // Launch kernel: 1024 blocks of 1024 threads = ~1M threads
    vector_add<<<(N + 1023) / 1024, 1024>>>(d_a, d_b, d_c, N);

    cudaMemcpy(h_c, d_c, N * sizeof(float), cudaMemcpyDeviceToHost);
}
\`\`\`

## The Memory Hierarchy

This is where CUDA gets interesting (and hard):

| Memory | Scope | Speed | Size |
|--------|-------|-------|------|
| Registers | Thread-local | ~1 cycle | Tiny |
| Shared memory | Block-local | ~5 cycles | 48KB |
| L1/L2 cache | Automatic | ~10-30 cycles | MBs |
| Global memory | All threads | ~200-800 cycles | GBs |

The key insight: **minimize global memory accesses**. Load data into shared memory, do your work there, write results back once.

## Coalesced Memory Access

Threads in a warp (group of 32) run simultaneously. If thread N accesses address N, the hardware merges them into a single transaction. If thread N accesses address N*128, you get 32 separate transactions.

Coalescing can be the difference between 100x and 2x speedup.

## Why I Use It

I got into CUDA for ML-adjacent work — writing custom kernels for operations that PyTorch doesn't implement efficiently, or implementing research papers that need hand-tuned GPU code.

It's the closest thing to assembly for modern hardware. And that appeals to me.
`,
  },
  {
    id: "neovim-config",
    title: "My Neovim Config: Built for C/Systems Work",
    date: "2026-05-10",
    tags: ["Neovim", "Lua", "Tooling", "Productivity"],
    seriesId: null,
    chapterIndex: null,
    excerpt: "I spent way too long on my neovim config. Here's what I actually use daily for systems programming in C, C++, and Zig.",
    content: `# My Neovim Config: Built for C/Systems Work

My [nvim config](https://github.com/souls-syntax/nvim) is public. Here's the philosophy behind it.

## The Core Plugins

I use very few plugins. Every one earns its place:

\`\`\`lua
-- Core LSP + completion
{ "neovim/nvim-lspconfig" }     -- language server protocol
{ "hrsh7th/nvim-cmp" }          -- completion engine
{ "hrsh7th/cmp-nvim-lsp" }      -- LSP completions

-- Fuzzy finding (the most important tool)
{ "nvim-telescope/telescope.nvim" }

-- Treesitter (syntax highlighting that understands code)
{ "nvim-treesitter/nvim-treesitter" }

-- git integration
{ "tpope/vim-fugitive" }

-- Minimal statusline
{ "nvim-lualine/lualine.nvim" }
\`\`\`

## LSP for C/C++/Zig

The game-changer for C is \`clangd\`. With a \`compile_commands.json\` (generated by CMake or Bear), you get:
- Go to definition across thousands of files
- Inline error checking
- Smart completions with documentation

For Zig: \`zls\` (Zig Language Server) is legitimately impressive given how new it is.

## My Keymaps Philosophy

I keep keymaps close to defaults. The ones I've added:

\`\`\`lua
-- LSP
vim.keymap.set("n", "gd",  vim.lsp.buf.definition)
vim.keymap.set("n", "K",   vim.lsp.buf.hover)
vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename)
vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action)

-- Telescope
vim.keymap.set("n", "<leader>ff", telescope.find_files)
vim.keymap.set("n", "<leader>fg", telescope.live_grep)
vim.keymap.set("n", "<leader>fb", telescope.buffers)
\`\`\`

## The colorscheme

I use **Catppuccin Mocha** with some adjustments. Dark enough that my eyes don't die, contrast high enough to distinguish types/functions/variables without effort.

## What I Don't Use

- Copilot/AI completion: too slow, too noisy for systems code where you need to reason about every line
- File trees (NERDTree/nvim-tree): Telescope's \`find_files\` is faster
- Multiple open buffers: one task, one file, always

The config is ~300 lines of Lua. Small enough to understand fully, powerful enough that I'm never reaching for VS Code.
`,
  },
];

// ─── Utility: Get series info for a blog ────────────────────────────────────
export function getSeriesForPost(post) {
  if (!post.seriesId) return null;
  return SERIES.find(s => s.id === post.seriesId) ?? null;
}

// ─── Utility: Get all chapters in a series ──────────────────────────────────
export function getSeriesChapters(seriesId) {
  return BLOGS
    .filter(b => b.seriesId === seriesId)
    .sort((a, b) => (a.chapterIndex ?? 0) - (b.chapterIndex ?? 0));
}

// ─── Utility: Simple fuzzy search ───────────────────────────────────────────
export function searchBlogs(query) {
  if (!query.trim()) return BLOGS;
  const q = query.toLowerCase();
  return BLOGS.filter(blog =>
    blog.title.toLowerCase().includes(q) ||
    blog.excerpt.toLowerCase().includes(q) ||
    blog.tags.some(t => t.toLowerCase().includes(q)) ||
    (blog.seriesId && blog.seriesId.toLowerCase().includes(q))
  );
}
