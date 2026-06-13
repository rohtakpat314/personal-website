const PROJECTS = {
  'riscv-cpu': {
    num: '01',
    slug: 'riscv-cpu',
    file: 'riscv-cpu.html',
    title: 'RV32IM CPU',
    summary: 'Single-cycle RV32IM processor in SystemVerilog. Timing optimization raised Fmax from 28 MHz to 49.18 MHz on Cyclone V while cutting resource use ~15×.',
    tools: ['SystemVerilog', 'Testbench Development', 'GTKWave', 'Icarus Verilog', 'Cyclone V', 'Static Timing Analysis', 'RISC-V'],
    status: null,
    github: 'https://github.com/rohtakpat314/riscvcpu',
    docs: [],
    overview: [],
    sections: [
      {
        title: 'Why I Built This',
        blocks: [
          { p: 'After completing two undergraduate courses in digital systems fundamentals, I wanted to build an entire processor from scratch. Seeing as RISC-V was popular and open-source, I decided to design a processor with the full RV32I instruction set. At first, my idea was to only support a subset of instructions, but I ended up implementing a strong, modular processor that I would eventually extend with the M-extension, leading to 55 instructions of support in total.' },
          { p: 'Prior to adding the M-extension, I synthesized my design at 60.42 MHz. An issue with my original design was using 0 DSP blocks and no block memory, causing everything to be implemented in logic. Adding the M-extension did affect my timing parameters, leading to a longer critical path and a degradation in my clock frequency from 60.42 MHz to ~28 MHz at one point due to the instruction complexity. Fixing this max clock frequency to a formidable number was one of the most valuable debugging and design modification changes I did on this project.' },
        ],
      },
      {
        title: 'Overview',
        blocks: [
          { p: 'Single-cycle RV32IM processor that executes the full integer instruction set plus the M-extension. Verified via simulation, testbenches, waveforms, and synthesis on FPGA. The main win wasn\'t designing this CPU, but using timing optimization to bring the max clock frequency from 28 MHz to 49 MHz while shrinking the design by $\\sim 15x$.' },
          { p: '$$F_{\\max,\\mathrm{final}} / F_{\\max,\\mathrm{worst}} = 49.18 / 28 \\approx 1.76\\times$$' },
        ],
      },
      {
        title: 'Tech Specs',
        blocks: [
          { specs: [
            { label: 'ISA', value: 'RV32I + M-extension (RV32IM)' },
            { label: 'Microarchitecture', value: 'Single-cycle base (CPI = 1 for RV32I); MUL ~3 cycles, DIV ~34 cycles with stall control' },
            { label: 'Multiply/divide', value: 'Pipelined (3-cycle) / iterative (34-cycle) units with stall control' },
            { label: 'Target', value: 'Intel Cyclone V 5CGXFC7D7F31C8' },
            { label: 'Verification', value: 'self-checking manual and directed unit tests' },
          ] },
        ],
      },
      {
        title: 'Architecture',
        blocks: [
          { p: 'RV32IM datapath in top.sv, consisting of PC, instruction memory, control unit, register file, immediate generator, ALU, multiply/divide units, and data memory.' },
          { image: {
            src: '../brand_assets/top_rtl.png',
            alt: 'Quartus RTL Viewer schematic of top.sv datapath',
            caption: 'Quartus RTL Viewer, top.sv (full datapath)',
            contain: true,
            wide: true,
          } },
          { galleryLink: {
            hint: 'Click on this image to view all individual parts from Quartus RTL',
            preview: '../brand_assets/reg_file_rtl.png',
            previewAlt: 'Register file RTL preview',
            items: [
                { src: '../brand_assets/pc_rtl.png', alt: 'Program counter RTL', caption: 'pc (u_pc)' },
                { src: '../brand_assets/instr_mem_rtl.png', alt: 'Instruction memory RTL', caption: 'instruction_mem (u_imem)' },
                { src: '../brand_assets/controlunit_rtl.png', alt: 'Control unit RTL', caption: 'control_unit (u_ctrl)' },
                { src: '../brand_assets/reg_file_rtl.png', alt: 'Register file RTL', caption: 'reg_file (u_regfile)' },
                { src: '../brand_assets/imm_gen_rtl.png', alt: 'Immediate generator RTL', caption: 'imm_gen (u_immgen)' },
                { src: '../brand_assets/ALU_rtl.png', alt: 'ALU RTL', caption: 'alu (u_alu)' },
                { src: '../brand_assets/mul_unit_rtl.png', alt: 'Pipelined multiply unit RTL', caption: 'mul_unit (u_mul)' },
                { src: '../brand_assets/div_unit_rtl.png', alt: 'Iterative divide unit RTL', caption: 'div_unit (u_div)' },
                { src: '../brand_assets/muldiv_rtl.png', alt: 'M-extension stall control RTL', caption: 'M-extension stall logic' },
                { src: '../brand_assets/datamemory_rtl.png', alt: 'Data memory RTL', caption: 'data_mem (u_dmem)' },
            ],
          } },
          { p: 'A decoding change: instead of a second decode stage to pick the ALU op, I encoded the ALU control so that ALU_control[2:0] are funct3, with the upper bit being used to distinguish base from M-extension. This lets is_mul/is_div and the operation variant fall out of simple bit tests, which makes the logic simpler.' },
          { table: {
            plain: true,
            headers: ['alu_control[4:2]', 'Family'],
            rows: [
              ['000', 'RV32I base'],
              ['100', 'MUL / MULH / MULHSU / MULHU'],
              ['101', 'DIV / DIVU / REM / REMU'],
            ],
          } },
          { code: `assign is_mul = (alu_control[4:2] == 3'b100);
assign is_div = (alu_control[4:2] == 3'b101);` },
          { code: `if (funct7 == FUNCT7_M)
    alu_control = {1'b1, 1'b0, funct3};
else
    alu_control = {1'b0, funct7[5], funct3};` },
          { subhead: 'Overflow logic' },
          { p: '$$\\mathrm{ovf}_{\\mathrm{ADD}} = \\big(a[31] = b[31]\\big) \\land \\big(r[31] \\neq a[31]\\big)$$' },
          { p: 'For ADD; SUB uses opposite sign check - see code.' },
          { code: `assign overflow = ((ALU_control == ADD) && (a[31] == b[31]) && (result[31] != a[31])) ||
                  ((ALU_control == SUB) && (a[31] != b[31]) && (result[31] != a[31]));` },
          { subhead: 'Branching logic' },
          { p: 'XOR branch: handles BEQ/BNE through the zero flag, BLT/BGE with SLT result and $\\texttt{funct3[0]}$ as an invert bit.' },
          { code: `assign branch_taken = branch && (funct3_out[2] ? (alu_result[0] ^ funct3_out[0])
                                               : (alu_zero ^ funct3_out[0]));` },
        ],
      },
      {
        title: 'How I Optimized This Processor',
        blocks: [
          { p: 'The fundamental constant is the clock time, which follows s.t.' },
          { p: '$$T_{\\mathrm{clk}} \\geq \\max(\\text{instruction combinational path delay})$$' },
          { p: 'The clock is set by the slowest instruction since it takes the longest time, so that means even if I had theoretically made 46 $5\\,\\mathrm{ns}$ operations ($200\\,\\mathrm{MHz}$), one $20\\,\\mathrm{ns}$ operation could completely destroy my max clock frequency.' },
          { p: 'Thus, the M-extension was the bottleneck because the RV32I base operations were only $10\\text{-}16\\,\\mathrm{ns}$ on average, but the divide and multiply on my M-extension took $> 30\\,\\mathrm{ns}$ because' },
          { list: [
            'Divide is serial, so every quotient bit depends on the previous partial remainder',
            'Can\'t parallelize a dependency chain, which is what occurs in the case of a 32-bit divider',
            'Multiply is a deep partial-product tree of adders, since it\'s functionally equivalent to performing many, many additions',
          ] },
          { p: 'I found that the M-extension was my bottleneck by synthesizing in Quartus, and the timing-closure report pointed at the divider being the likely cause of a long critical path for setup time.' },
          { subhead: 'Fix 1: replace the combinational divide with a 34-cycle restoring divider performing one subtract per clock' },
          { code: `wire [63:0] aq_sl  = {aq[62:0], 1'b0};
wire [32:0] trial  = {1'b0, aq_sl[63:32]} - {1'b0, dvsr};
wire        ge     = ~trial[32];
wire [63:0] aq_nxt = ge ? {trial[31:0], aq_sl[31:1], 1'b1}
                        : aq_sl;` },
          { subhead: 'Fix 2: the data memory was traditionally implemented in logic because my data memory had an asynchronous read, which cannot infer block RAM' },
          { p: 'An array [0:1023] is 32 KiB or 1024 words * 32 bits, which is synthesized as 32768 registers. Shrinking to 64 words results in only 2048 FFs. This explains most of the register drop.' },
          { subhead: 'Fix 3: I moved multiply into a 3-cycle pipelined unit, registering operands and the product so that Quartus would pack the DSP registers.' },
          { code: `wire a_signed = (op != 2'b11);
wire b_signed = (op == 2'b00) | (op == 2'b01);
wire signed [32:0] a_ext = a_signed ? {a[31], a} : {1'b0, a};
wire signed [32:0] b_ext = b_signed ? {b[31], b} : {1'b0, b};` },
          { subhead: 'Fix 4: Stall Control' },
          { code: `assign start_mul = (mul_state == 1'b0) & is_mul;
assign start_div = (div_state == 1'b0) & is_div;
assign mul_stall = is_mul & ~mul_done;
assign div_stall = is_div & ~div_done;
assign stall     = mul_stall | div_stall;

assign pc_in       = stall ? pc_out : pc_next;
assign reg_write_g = reg_write & ~stall;
assign mem_write_g = mem_write & ~stall;

assign write_data = is_mul          ? mul_result
                  : is_div          ? div_wb
                  : lui            ? imm
                  : mem_to_reg[1] ? pc_plus4
                  : mem_to_reg[0] ? mem_read_data
                  :                 alu_result;` },
        ],
      },
      {
        title: 'Performance Metrics',
        blocks: [
          { table: {
            headers: ['Configuration', 'Fmax', 'ALMs', 'Registers', 'DSPs'],
            rows: [
              ['Combinational mul + div', '28 MHz', '36805', '33962', '9'],
              ['Iterative divide + mem shrink', '32 MHz', '2546', '3229', '9'],
              ['Adding pipelined multiply', '49.18 MHz', '2469/56480', '3208', '3'],
            ],
          } },
          { image: {
            src: '../brand_assets/img1_rv32im.png',
            alt: 'Quartus timing analyzer Fmax summary',
            caption: 'Static timing analysis, Fmax = 49.18 MHz',
            contain: true,
          } },
          { image: {
            src: '../brand_assets/img2_rv32im.png',
            alt: 'Quartus Prime Flow Summary',
            caption: 'Quartus Flow Summary',
            contain: true,
          } },
          { image: {
            src: '../brand_assets/img4_rv32im.png',
            alt: 'Quartus PowerPlay power analysis',
            caption: 'Power Analysis Summary',
            contain: true,
          } },
        ],
      },
      {
        title: 'Design Challenges',
        blocks: [
          { subhead: '1. Finding the timing issue' },
          { p: 'When first adding the M-extension, Quartus kept struggling to fit my new design into the FPGA board of my choice due to ALM consumption and had a very low Fmax. Reading the fitter report and Quartus\'s recommendations led me to use aggressive fitting and notice how the four combinational dividers were each using 10000-13000 ALMs' },
          { image: {
            src: '../brand_assets/img3_rv32im.png',
            alt: 'Quartus timing closure recommendations',
            caption: 'Timing Closure Report',
            contain: true,
          } },
          { subhead: '2. The incorrect lui bug' },
          { p: 'After noticing all my results being X in my simulations, I read through the RISC-V manual and did some research and blamed my lui function too early, since it seemed like a common point for failure. I wrote a directed testbench just for lui and it passed, which taught me about targeted testing and finding where the points of failure actually are in RTL design, along with the importance of modularity in designs.' },
          { code: 'lui(x, 0x10000) → x20 = 0x10000000' },
          { subhead: '3. Stall logic' },
          { p: 'Making multiply/divide multi-cycle meant the PC and register/memory writes had to freeze for the correct number of cycles and then resume right after. I had to carefully reason and also diagram these operations to avoid having any writeback issues in the last stage of the instruction cycle.' },
        ],
      },
      {
        title: 'Verification',
        blocks: [
          { subhead: '1. Directed testing and GTKWave debugging' },
          { p: 'Used directed testing by creating hand-written tests in either program.hex or C code and then converting it to machine code. Ran it on the CPU and checked corner cases. Example programs I wrote include Bubble Sort, the Fibonacci Sequence, and MUL/DIV testing programs.' },
          { list: [
            'Examples include lui, ADD, SUB, MUL, DIV',
            'Branch testing to ensure branches were taken appropriately',
          ] },
          { p: 'Used GTKWave to analyze waveforms and register file values, comparing them to expected values for each program.' },
          { image: {
            src: '../brand_assets/RV32M_extension_waveform.png',
            alt: 'GTKWave waveform of RV32IM M-extension instructions',
            caption: 'GTKWave, RV32IM M-extension (lui, mul, div) with stall control',
            contain: true,
          } },
          { image: {
            src: '../brand_assets/RV32I_fibonacci_sequence.png',
            alt: 'GTKWave waveform of Fibonacci sequence program on RV32I',
            caption: 'GTKWave, RV32I Fibonacci loop with branch taken/not taken',
            contain: true,
          } },
          { subhead: '2. Self-checking testbench' },
          { p: 'Used self-checking testbench methods by running programs and checking to see if specific, expected values were in the register file by the end. I used this to check the Fibonacci sequence program, and I adapted tb_top.sv to each new program I made.' },
          { image: {
            src: '../brand_assets/fibonacci.png',
            alt: 'GTKWave register file values during Fibonacci sequence execution',
            caption: 'Register file values during Fibonacci sequence execution',
            contain: true,
          } },
          { subhead: '3. SystemVerilog Assertions (SVA)' },
          { p: 'Used SVA by ensuring that the CPU followed expected behaviors, such as incrementing the PC correctly or no simultaneous operations conflicting with each other.' },
        ],
      },
      {
        title: 'Future Work',
        blocks: [
          { list: [
            'Pipeline the core (IF/ID/EX/MEM/WB) to get past the 49 MHz ceiling and entering 100+ MHz territory',
            'Hazard detection and forwarding for pipelining',
            'Using Block RAM',
          ] },
        ],
      },
    ],
    visuals: [
      { type: 'image', src: '../brand_assets/RISC-V-logo-square.svg.avif', alt: 'RISC-V logo', caption: 'RISC-V architecture', contain: true, aspect: 'square' },
    ],
  },

  'axi-matrix': {
    num: '02',
    slug: 'axi-matrix',
    file: 'axi-matrix.html',
    title: 'AXI4-Lite Matrix Accelerator',
    summary: 'Memory-mapped matrix accelerator computing A x B = C for 4x4 systolic matrices on AXI4-Lite. 175x kernel speedup, ~11x end-to-end, integrated with RV32IM.',
    tools: ['SystemVerilog', 'Quartus Prime', 'AXI4-Lite', 'Python', 'Testbench Development', 'Cyclone V'],
    status: null,
    github: 'https://github.com/rohtakpat314/axi4-lite-matrix-accelerator',
    webapp: 'https://rohtakpat314.github.io/axi4-lite-matrix-accelerator/',
    docs: [],
    overview: [],
    sections: [
      {
        title: 'Why I Built This',
        blocks: [
          { p: 'Entering this project, I understood the behavior of CPUs and mine in particular, which was a RV32IM processor. However, I noticed a large bottleneck in my operational efficiency when implementing the M-extension, leading to a large critical path for DIV and MUL operations due to the arithmetic complexity.' },
          { p: "Inspired by the systolic arrays behind modern AI accelerators such as Google's TPU, I built a small 4x4 matrix accelerator with an AXI4-Lite interface and systolic-style MAC array to learn the hardware acceleration loop end-to-end and measure the speed-up. However, I had one lingering question during this entire process: when making the compute that much faster, what becomes the new bottleneck?" },
        ],
      },
      {
        title: 'Overview',
        blocks: [
          { p: 'A $4 \\times 4$ integer matrix multiply $C = A \\times B$ is offloaded from an RV32IM host CPU to a dedicated spatial MAC array over a memory-mapped AXI4-Lite interface. My project sought to answer these main questions:' },
          { list: ['Compute kernel speedup?', 'End-to-end system speedup?', 'New performance bottleneck?'] },
          { p: 'For this project, I chose the following specs to work with:' },
          { list: ['AXI4-Lite slave interface', '4 x 4 spatial MAC array compute engine (16 processing elements)', '32-bit integer datatype', 'RV32IM single-cycle CPU as the host', 'Intel Cyclone V as the FPGA target for synthesis and compilation'] },
        ],
      },
      {
        title: 'Results at a Glance',
        blocks: [
          { stats: [
            { value: '175×', label: 'Kernel speedup (1050 → 6 cycles)' },
            { value: '~10.3×', label: 'End-to-end system speedup' },
            { value: '6', label: 'Compute cycles in the systolic array' },
            { value: '65.35 MHz', label: 'Fmax on Cyclone V' },
          ] },
        ],
      },
      {
        title: 'Architecture',
        blocks: [
          { p: "A matrix multiply is a set of dot products, to obtain the i,j'th element of our output matrix C, we need to perform a dot product of the ith row of A and the jth column of B, for $A \\times B = C$." },
          { p: 'This can be rewritten as:' },
          { p: '$$C_{ij} = \\sum_{k=0}^{3} A_{ik}\\,B_{kj}, \\quad i, j \\in \\{0, 1, 2, 3\\}$$' },
          { p: 'For an $n \\times n$ product this is $n^3$ multiply-accumulates, or 64 MACs. This is because every element of the output corresponds to the sum of 4 products, so obtaining a 4x4 result would take 64 total sums of products.' },
          { p: 'Spatially, I instantiate 16 processing elements, one per output element $C_{ij}$. The idea here is to share the index $k$ or the contraction index across all PEs, meaning that on each compute cycle every PE multiplies its $A_{ik}\\,B_{kj}$ for the same $k$ and accumulates. Therefore, instead of needing 64 total MACs sequentially, I can do 16 MACs per cycle (one MAC corresponding to one product), and then do 4 of them due to the four sums, leading to 4 cycles of 16 MACs.' },
          { code: `always @(*) begin
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            prod[i][j] = {{32{1'b0}}, a[i*4 + k]} *
                         {{32{1'b0}}, b[k*4 + j]};
end` },
          { p: '$$\\text{Cycles}_{\\text{compute}} = n + \\text{overhead} = 4 + \\text{latch} \\approx 6$$' },
          { galleryLink: {
            caption: 'Quartus RTL Viewer (click to view both pages)',
            preview: '../brand_assets/mat_accel_rtl.png',
            previewAlt: 'mat_accel_slave RTL page 1',
            wide: true,
            items: [
              { src: '../brand_assets/mat_accel_rtl.png', alt: 'mat_accel_slave RTL page 1', caption: 'Page 1' },
              { src: '../brand_assets/mat-accel-2-rtl.png', alt: 'mat_accel_slave RTL page 2', caption: 'Page 2' },
            ],
          } },
        ],
      },
      {
        title: 'FSM Design',
        blocks: [
          { p: 'IDLE -> COMPUTE -> LATCH' },
          { image: {
            src: '../brand_assets/diagramfinal.drawio.png',
            alt: 'State diagram for systolic_arr IDLE, Compute, and LATCH states',
            caption: 'systolic_arr compute FSM',
            contain: true,
            wide: true,
          } },
          { p: 'During the compute phase, all 16 multipliers are working in parallel, so the partial products are accumulating. After $k = 3$, LATCH will write the 16 results and the signal "done" will be effectively declared.' },
        ],
      },
      {
        title: 'Accumulator Bit-Width',
        blocks: [
          { p: 'An interesting design choice I noticed while performing these 32-bit $\\times$ 32-bit multiplies is how the result is 64 bits, but accumulating 4 of them can increase the bitwidth to 66 due to $\\log_2(4)$, hence why I designed the accumulators to be 66 bits just in case. This design choice led to a 100% verification that there would be absolutely no chance for overflow.' },
          { code: `logic [65:0] acc  [0:3][0:3];
logic [63:0] prod [0:3][0:3];` },
        ],
      },
      {
        title: 'Memory-Mapped I/O',
        blocks: [
          { p: 'This is the memory-mapped I/O:' },
          { list: [
            '0x000 - 0x03C is Matrix A, write',
            '0x040 - 0x07C is Matrix B, write',
            '0x080 is CONTROL, or write',
            "0x084 is the status, which is read, bit 1's value being sticky vs. busy determines whether it's ready",
            '0x088 - 0x0C4 is a read result, which reads Matrix C',
          ] },
          { code: `if (s_awvalid && s_wvalid) begin
    if      (s_awaddr[7:6] == 2'b00)       matrix_a[s_awaddr[5:2]] <= s_wdata;
    else if (s_awaddr[7:6] == 2'b01)       matrix_b[s_awaddr[5:2]] <= s_wdata;
    else if (s_awaddr[7:0] == 8'h80)       accel_start             <= s_wdata[0];
end` },
        ],
      },
      {
        title: 'Performance Metrics',
        blocks: [
          { list: [
            'The software MATMUL on the CPU took 1050 cycles',
            'The accelerator kernel took 6 cycles',
            'The actual accelerator end-to-end, including the accelerator kernel took 102 cycles',
          ] },
          { p: 'This is a kernel speed-up of 175x, and a end-to-end speedup of about 10.3x, which is expected' },
        ],
      },
      {
        title: 'Quartus Prime Synthesis',
        blocks: [
          { list: [
            'Fmax: 65.35 MHz',
            'ALMs: 1,411/56,480 (2%)',
            'Registers: 2772',
            "DSP Blocks: 32/156 ~ 21%, makes complete sense since it's 16 PEs and 2 DSP slices per 32-bit multiply",
            'Block RAM - 0',
            'Core dynamic power of 23 mW',
          ] },
          { image: {
            src: '../brand_assets/mat-accel-timing1.png',
            alt: 'Quartus timing analyzer Fmax summary for mat_accel',
            caption: 'Static timing analysis, Fmax = 65.35 MHz',
            contain: true,
          } },
          { image: {
            src: '../brand_assets/mat-ACCEL-timing2.png',
            alt: 'Quartus timing closure recommendations for systolic array',
            caption: 'Timing closure report, systolic_arr accumulator critical path',
            contain: true,
          } },
        ],
      },
      {
        title: 'Why the Kernel and System Disagree in Performance Boost',
        blocks: [
          { p: 'The kernel may be 175x faster, but the system is only 10.3x faster. Why?' },
          { p: "The math behind this is as follows: The compute is $6$ cycles, but moving the data is $48$ words since you have to move $16$ words for A, B, and C across a single bus, which means $1$ CPU Load/Store per word. The CPU does a load from memory + a store to the AXI bus, so that's $96$ cycles of data movement." },
          { p: "Using Amdahl's Law, we get:" },
          { p: '$$\\frac{T_{sw}}{T_{move} + T_{compute}} = \\frac{1050}{96 + 6} \\approx 10.3\\times$$' },
          { p: 'This can also be explained through a simple analogy:' },
          { subhead: 'Ordering food at a restaurant…' },
          { callout: "When ordering food at a restaurant, you make an order, the chef makes the dish, and you receive it. During this process, the longest path is typically the chef making the dish. Therefore, if the server decides to walk with your food to your table faster, it makes a nearly negligible difference in the long-run. What would really make a difference in the time it takes for your food to come is the chef's speed, and I'd honestly prefer my food being well-cooked." },
        ],
      },
      {
        title: 'Challenges',
        blocks: [
          { subhead: 'A result = x bug' },
          { p: 'When running simulations and writing testbenches, I kept getting returned result = x. My first guess was an issue with the lui instruction, but I was wrong. I created an entire lui testbench and wrote some Python code below to try to diagnose the issue, but lui seemed to work fine. After running all RISC-V instructions and noticing the issue was with the accelerator (plus reading up on simulator behavior and asking the open-source community), I realized that Icarus Verilog mishandles variable-indexed unpacked array module ports. I fixed it by passing the matrices as a flat [511:0] packed vector and unpacking them internally.' },
          { subhead: 'The AXI compliance with a host that never waits' },
          { p: "A single-cycle CPU doesn't stall, but the protocol requires proper handshaking (ready and write). This was the hardest fix in terms of technical adjustments, requiring me to create a pollable status register and have always-ready channels." },
        ],
      },
      {
        title: 'Design Decisions and Tradeoffs',
        blocks: [
          { list: [
            "Spatial MAC array, since it's not perfectly systolic. A true systolic array would forward operands PE-to-PE pipelined instead of broadcasting k.",
            'AXI4-Lite and not AXI4 (Full). AXI4-Lite had a clean register map, and was easy to verify, but the I/O bottleneck was very obvious after verification.',
            "Combinational reads and non-stalling writes, so the host's single-cycle timing is matched (hardest part by far)",
          ] },
        ],
      },
      {
        title: 'Web App',
        blocks: [
          { p: "I designed a web-app to simulate how the entire system works. You're welcome to check it out." },
          { link: { href: 'https://rohtakpat314.github.io/axi4-lite-matrix-accelerator/', label: 'Open the interactive web app' } },
        ],
      },
    ],
    highlights: [],
    visuals: [
      { type: 'image', src: '../brand_assets/axi4_usethisone.png', alt: 'RV32IM CPU + 4x4 matrix accelerator architecture', caption: 'System architecture: CPU, address decoder, and 4×4 PE array', contain: true },
      { type: 'image', src: '../brand_assets/axi-matrix-cover.png', alt: 'RV32IM CPU + 4x4 matrix accelerator writeup', caption: 'Project writeup' },
    ],
  },

  'instrument-bridge': {
    num: '03',
    slug: 'instrument-bridge',
    file: 'instrument-bridge.html',
    title: 'USB CDC Bridge for RP2040',
    summary: 'USB CDC bridge for RP2040 using I2C, SPI, UART, and 1-Wire. Turns hardware validation from write-flash-debug loops into terminal commands.',
    tools: ['C', 'RP2040', 'CMake', 'Pico SDK', 'USB CDC'],
    status: null,
    github: 'https://github.com/rohtakpat314/Multi-protocol-instrument-bridge',
    docs: [
      { label: 'Architecture', href: 'https://github.com/rohtakpat314/Multi-protocol-instrument-bridge/blob/main/docs/architecture.md' },
      { label: 'Command Reference', href: 'https://github.com/rohtakpat314/Multi-protocol-instrument-bridge/blob/main/docs/command-reference.md' },
      { label: 'Hardware Bring-Up', href: 'https://github.com/rohtakpat314/Multi-protocol-instrument-bridge/blob/main/docs/hardware-bringup.md' },
      { label: 'Testing Strategy', href: 'https://github.com/rohtakpat314/Multi-protocol-instrument-bridge/blob/main/docs/testing.md' },
    ],
    overview: [],
    sections: [
      {
        title: 'Why I Built This',
        blocks: [
          { p: 'When bringing up sensors and peripherals on the bench, I kept falling into write-flash-debug loops for every I2C scan, SPI read, or UART check. Each small experiment meant rebuilding firmware, reflashing, and reading back over a debugger or ad-hoc test code.' },
          { p: 'I wanted a single RP2040 board that exposes I2C, SPI, UART, and 1-Wire over a USB virtual serial port. The host sends newline-terminated text commands; firmware parses them, runs the bus transaction, and replies with OK, ERR, or TIMEOUT. That turns hardware validation into terminal work instead of repeated flash cycles.' },
        ],
      },
      {
        title: 'Overview',
        blocks: [
          { p: 'A USB CDC adapter for I2C, SPI, UART, and bit-banged 1-Wire. The host sees a virtual serial port and sends newline-terminated text commands. Firmware executes the corresponding bus transactions and replies with OK, ERR, or TIMEOUT prefixes.' },
          { p: 'The command parser in command.c is written in portable C with no Pico SDK dependencies. Host-side parser tests in tests/parser_tests.c link against fake bus backends, so grammar and reply formatting are testable without hardware. Hardware-specific code lives behind include/bridge/bus.h, the portability boundary for future MCU backends.' },
        ],
      },
      {
        title: 'Tech Specs',
        blocks: [
          { specs: [
            { label: 'Host interface', value: 'USB CDC virtual serial port (no custom driver)' },
            { label: 'Protocols', value: 'I2C, SPI, UART, 1-Wire' },
            { label: 'Number formats', value: 'Decimal, hex (0x1A), octal, binary (0b11010)' },
            { label: 'Max transfer', value: '64 bytes (bounded RAM and blocking time)' },
            { label: 'Reply prefixes', value: 'OK, ERR, TIMEOUT' },
            { label: 'Flash artifact', value: 'build/probebridge.uf2' },
          ] },
        ],
      },
      {
        title: 'Architecture',
        blocks: [
          { p: 'The design splits a portable command layer from a replaceable bus backend. command.c owns user-facing syntax and validation. bus_pico.c owns RP2040 peripheral setup and transactions. bus.h is the contract that lets you swap in another MCU backend without touching the parser.' },
          { code: `PC terminal or script
        |
        | USB CDC text lines
        v
stdio USB
        |
        v
line_editor.c  ->  command.c  ->  bus.h  ->  bus_pico.c
                                              |
                                              v
                                    I2C / SPI / UART / 1-Wire` },
          { table: {
            plain: true,
            headers: ['Module', 'Responsibility'],
            rows: [
              ['src/main.c', 'Boots USB stdio, initializes buses, runs the command loop'],
              ['src/line_editor.c', 'Collects characters into newline-terminated command strings'],
              ['src/command.c', 'Tokenizes commands, validates args, dispatches ops, formats replies'],
              ['include/bridge/bus.h', 'Bus abstraction used by the parser and host tests'],
              ['src/bus_pico.c', 'RP2040 I2C, SPI, UART, GPIO, and 1-Wire implementation'],
              ['tests/parser_tests.c', 'Host-side parser tests with fake bus functions'],
            ],
          } },
          { p: 'Text commands over USB CDC trade throughput for bench usability: readable, scriptable, and debuggable from any terminal. Transfer payloads are capped at 64 bytes to keep RAM use and accidental long-blocking commands bounded.' },
          { p: 'Host-testable parser tests are the key architectural choice. Command grammar and reply formatting are verified on the build machine before flashing, using fake bus functions that mirror the bus.h interface.' },
        ],
      },
      {
        title: 'Hardware',
        blocks: [
          { table: {
            plain: true,
            headers: ['Protocol', 'Signal', 'GPIO'],
            rows: [
              ['I2C0', 'SDA / SCL', 'GP4 / GP5'],
              ['SPI0', 'MISO / CS / SCK / MOSI', 'GP16 / GP17 / GP18 / GP19'],
              ['UART0', 'TX / RX', 'GP0 / GP1'],
              ['1-Wire', 'DQ', 'GP22'],
            ],
          } },
          { specs: [
            { label: 'I2C', value: 'Bus scan, read, write, repeated-start write-read' },
            { label: 'SPI', value: 'Full-duplex transfers with chip-select control' },
            { label: 'UART', value: 'Configurable baud, byte-level read and write (8N1)' },
            { label: '1-Wire', value: 'Bit-banged reset, read, write' },
          ] },
        ],
      },
      {
        title: 'Command Examples',
        blocks: [
          { table: {
            plain: true,
            headers: ['Command', 'Description'],
            rows: [
              ['i2c scan', 'Scan I2C bus for devices'],
              ['i2c read 0x68 6', 'Read 6 bytes from device 0x68'],
              ['i2c wr 0x68 2 0x75', 'Write-read sequence'],
              ['spi xfer 0x9F 0x00 0x00 0x00', 'Full-duplex SPI transfer'],
              ['uart speed 115200', 'Set UART baud rate'],
              ['ow reset / ow read 8', '1-Wire reset and read'],
            ],
          } },
        ],
      },
      {
        title: 'Build and Test',
        blocks: [
          { specs: [
            { label: 'Firmware build', value: 'cmake -S . -B build && cmake --build build' },
            { label: 'Host parser tests', value: 'cmake -DBRIDGE_HOST_TESTS=ON (no Pico SDK required)' },
            { label: 'Documentation', value: 'Markdown docs + LaTeX manual (docs/latex/manual.tex)' },
          ] },
        ],
      },
    ],
    visuals: [
      { type: 'image', src: '../brand_assets/rp2040-removebg-preview.png', alt: 'RP2040-Zero board', caption: 'RP2040 development board', contain: true },
    ],
  },

  'fes-ocpd': {
    num: '04',
    slug: 'fes-ocpd',
    file: 'fes-ocpd.html',
    title: 'Overcurrent Protection Circuit',
    summary: 'Analog overcurrent detection for biphasic FES device using an op-amp integrator, window comparator, and SR-latch. During overcurrent events, interrupts sent to MCU, resulting in LOW state (no current delivered to patient). Helps keep patients safe while helping their lower limb musculature.',
    tools: ['KiCad', 'Altium', 'LTspice', 'CMOS Logic', 'Circuit Design'],
    status: null,
    github: null,
    docs: [],
    overview: [],
    sections: [
      {
        title: 'Why I Built This',
        blocks: [
          { p: 'As a member of the FES Hardware team at Insight Wisconsin, I develop an overcurrent protection circuit that pairs with the overall FES device to protect patients from overcurrent events. The device delivers biphasic current to help patients with lower limb musculature issues, and since stimulation runs through electrodes, overcurrent events should be detected and stopped.' },
          { p: 'I took the lead for this project. The goal was an analog signal chain that detected overcurrent via an op-amp integrator and window comparator with upper and lower thresholds that would send an interrupt (EXTI) to the MCU to prevent more current from being delivered to the patient.' },
        ],
      },
      {
        title: 'Overview',
        blocks: [
          { p: 'Overcurrent protection signal chain with FES device developed with Insight Wisconsin in collaboration with UW Health Orthotics and Prosthetics clinic. Detects overcurrent events and sends an EXTI to the MCU to halt stimulation.' },
          { p: 'The design is a chain of an op-amp integrator, window comparator, and SR-latch (digitalize values to boolean to determine whether current can continue or needs to be stopped). The thresholds were decided via LTspice simulation to determine a VH and VL. The device uses a current source to keep a constant current since the patient is technically the load in this case, or has the same voltage across it as a theoretical load in a circuit.' },
        ],
      },
      {
        title: 'Tech Specs',
        blocks: [
          { specs: [
            { label: 'Current limit', value: '50mA' },
            { label: 'Response time', value: '< 25 ms' },
            { label: 'Signal chain', value: 'Integrator, window comparator, SR latch' },
            { label: 'MCU interface', value: 'EXTI interrupt on fault' },
            { label: 'Simulation', value: 'LTspice threshold characterization' },
            { label: 'Schematic', value: 'KiCad' },
            { label: 'Application', value: 'Biphasic FES medical device' },
          ] },
        ],
      },
      {
        title: 'LTspice Diagram',
        blocks: [
          { image: {
            src: '../brand_assets/ltspice.png',
            alt: 'LTspice overcurrent protection schematic',
            caption: 'LTspice diagram',
            contain: true,
          } },
          { p: 'The LTspice diagram has disconnections because I used a pulse voltage to help with deciding comparator upper and lower thresholds, and that is what\'s in the screenshot.' },
        ],
      },
      {
        title: 'What I Learned',
        blocks: [
          { p: [
            'I learned how to research and design a FES EMG project from ground up, using LTspice and KiCad design principles to help with making schematics, PCBs, and testing them.',
            'Presented at F25 and SP26 design reviews and incorporated feedback from professors and the team, seeking advice and asking for overall opinions to gauge if there are any flaws in my design. Updated the simulation and schematic and brought the revised design back to the team until we all unanimously agreed that the protection path was complete and functional.',
            'Implementing next stage in Fall 2026 as the FES Hardware Co-Lead: hardware integration with the FES device.',
          ] },
        ],
      },
    ],
    visuals: [],
  },

  'arcade': {
    num: '05',
    slug: 'arcade',
    file: 'arcade.html',
    title: '8x8 NeoPixel Mini Arcade',
    summary: 'A mini-arcade built using a WS2812B and ATmega328P / Arduino UNO. Hand-soldered, designed with EasyEDA, and implemented on perfboard. Players can play Snake, Ping Pong, and more.',
    tools: ['C++', 'ATmega328P', 'WS2812B NeoPixel', 'PCB Design', 'Soldering'],
    status: null,
    github: 'https://github.com/rohtakpat314/ece210-final-project',
    docs: [
      { label: 'ECE 210 Report', href: '../brand_assets/Patwardhan_Rohtak_ECE210.pdf' },
    ],
    overview: [],
    sections: [
      {
        title: 'Why I Built This',
        blocks: [
          { p: "During my first-year of undergraduate Electrical Engineering, we had a 2-credit lab course where students were tasked with creating a project of their choice. I decided that I wanted to explore the Arduino libraries more, specifically Adafruit's NeoPixel library, and using a NeoPixel WS2812B seemed versatile in practice." },
          { p: "At first, my original idea was to make an Audio Spectrum Analyzer using Arduino's DFT/FFT libraries and using a sound sensor to input noises and obtain a real-time spectrogram reflecting the frequencies (categorized in bins). However, our parts order never fully came through. At this point, I decided to change the project to be a mini arcade, but also allow functionality for a future extension to be implemented for the spectrum analyzer." },
        ],
      },
      {
        title: 'Overview',
        blocks: [
          { p: 'This project reflects a playable arcade console on an 8x8 NeoPixel LED Matrix (WS2812B) driven by an ATmega328P on an Arduino UNO. The 8x8 NeoPixel is capable of implementing compact games and visuals within a 64-pixel display, making it extremely multifaceted in practice. The code, written in C++, has control for game state management and has a logical flow for edge detection and game logic.' },
        ],
      },
      {
        title: 'Circuit',
        blocks: [
          { p: 'The hardware was designed in EasyEDA and built on perfboard. An Arduino UNO (ATmega328P) drives an 8×8 WS2812B NeoPixel matrix over a single data line, with two soldered push buttons for game input and a 500 µF decoupling capacitor on the 5 V rail.' },
          { p: 'In terms of putting this together, I used an EPLZON PCB Board (perfboard), solder wire, and a soldering iron to create all the connections.' },
          { image: {
            src: '../brand_assets/ledmatrix2.png',
            alt: 'EasyEDA circuit schematic: Arduino UNO, 8x8 NeoPixel matrix, and push buttons',
            caption: 'EasyEDA schematic: NeoPixel data on D4 (via 1 kΩ), buttons on D2 and D3, 500 µF bulk cap on 5 V',
            contain: true,
          } },
          { specs: [
            { label: 'NeoPixel data', value: 'Arduino D4 → 1 kΩ → Din' },
            { label: 'Left button', value: 'Arduino D3 → GND (INPUT_PULLUP)' },
            { label: 'Right button', value: 'Arduino D2 → GND (INPUT_PULLUP)' },
            { label: 'Power', value: '5 V + 500 µF decoupling cap' },
          ] },
        ],
      },
      {
        title: 'Tech Specs',
        blocks: [
          { specs: [
            { label: 'MCU', value: 'ATmega328P, 32KB flash, 2KB ram' },
            { label: 'Display', value: '8x8 WS2812B Neopixel' },
            { label: 'Games (tested)', value: 'Snake, Pong, Flappy Bird' },
            { label: 'Input', value: '2 general-purpose, soldered push buttons' },
            { label: 'Refresh Rate', value: '~23.9 FPS' },
            { label: 'Push Button Average Input Latency', value: '~20 ms' },
          ] },
        ],
      },
      {
        title: 'Code',
        blocks: [
          { p: 'The game loop runs every delay(40), meaning each iteration takes $T_{\\mathrm{loop}} = 40\\,\\mathrm{ms}$. The loop frequency is' },
          { p: '$$f_{\\mathrm{loop}} = \\frac{1000}{40} = 25\\,\\mathrm{Hz}$$' },
          { p: 'Since draw() is also called every iteration, the display refresh rate is approximately $25\\,\\mathrm{FPS}$. Snake movement is handled separately:' },
          { code: `tick++;
if (tick > 6) {
    tick = 0;
    updateSnake();
}` },
          { p: 'Movement occurs every 7 loops:' },
          { p: '$$T_{\\mathrm{step}} = 7 \\times 40\\,\\mathrm{ms} = 280\\,\\mathrm{ms}$$' },
          { p: 'So the snake movement rate is' },
          { p: '$$f_{\\mathrm{snake}} = \\frac{1}{0.280\\,\\mathrm{s}} \\approx 3.57\\,\\mathrm{Hz}$$' },
          { p: 'Therefore:' },
          { p: '$$f_{\\mathrm{loop}} = 25\\,\\mathrm{Hz}, \\quad f_{\\mathrm{render}} = 25\\,\\mathrm{FPS}, \\quad f_{\\mathrm{snake}} \\approx 3.57\\,\\mathrm{Hz}, \\quad T_{\\mathrm{step}} \\approx 280\\,\\mathrm{ms}$$' },
          { p: 'However, in reality, the documentation says the show() method can add a small amount of time. For 64 LEDs, the serial transmission time is' },
          { p: '$$T_{\\mathrm{show}} = 64 \\times 24 \\times 1.25\\,\\mu\\mathrm{s} = 1.92\\,\\mathrm{ms}$$' },
          { p: 'The effective frame period is $T_{\\mathrm{frame}} \\approx 40 + 1.92 = 41.92\\,\\mathrm{ms}$, so the actual frame rate is closer to' },
          { p: '$$f_{\\mathrm{render}} \\approx \\frac{1000}{41.92} \\approx 23.9\\,\\mathrm{FPS}$$' },
        ],
      },
      {
        title: 'Challenges in Code',
        blocks: [
          { subhead: '1. Food can spawn inside the Snake' },
          { p: 'The food can spawn inside the Snake, since the code is' },
          { code: `foodX = random(0, 8);
foodY = random(0, 8);` },
          { subhead: '2. Snake growth visual glitch' },
          { p: 'The snake growth has a bug that causes the new tail segment to not be initialized' },
          { code: `if (snakeLen < MAX_SNAKE) snakeLen++;` },
          { p: 'In theory this works, but it can cause visual glitches.' },
          { subhead: '3. Relative rotation control for two push-buttons' },
          { p: 'Noticed issues with controlling Snake via two push-buttons, so I implemented a relative rotation control rather than absolutely directional. Since right is akin to clockwise, or the way a clock rotates, pressing the right button will rotate the figure clockwise by $90^\\circ$, and the other option will do $90^\\circ$ counterclockwise.' },
          { list: [
            'Left rotates counter-clockwise by $90^\\circ$',
            'Right rotates clockwise by $90^\\circ$',
          ] },
          { code: `if (left && !prevL) {
  dir--;
  if (dir < 0) dir = 3;
}

if (right && !prevR) {
  dir++;
  if (dir > 3) dir = 0;
}` },
        ],
      },
      {
        title: 'Future Improvements',
        blocks: [
          { list: [
            'Additional arcade games tested',
            'Score-tracking and storage for game score',
            'Improved food spawning logic for Snake',
          ] },
        ],
      },
    ],
    visuals: [
      { type: 'video', src: '../brand_assets/arcade-demo.mp4', alt: 'Arcade gameplay demo', caption: 'Gameplay demo' },
      { type: 'image', src: '../brand_assets/8x8led1.png', alt: '8x8 LED matrix board', caption: 'Assembled hardware' },
    ],
  },
};

const PROJECT_ORDER = [
  'riscv-cpu',
  'axi-matrix',
  'instrument-bridge',
  'fes-ocpd',
  'arcade',
];
