const PROJECTS = {
  'riscv-cpu': {
    num: '01',
    slug: 'riscv-cpu',
    file: 'riscv-cpu.html',
    title: 'RISC-V Single-Cycle CPU',
    summary: 'Single-cycle RV32IM processor in SystemVerilog, synthesized on Altera Cyclone V.',
    tools: ['SystemVerilog', 'Testbench Development', 'GTKWave', 'Icarus Verilog', 'Cyclone V', 'Static Timing Analysis', 'RISC-V'],
    status: null,
    github: 'https://github.com/rohtakpat314/riscvcpu',
    docs: [],
    overview: [
      'Single-cycle RV32I processor in SystemVerilog implementing all 47 R/I/S/B/U/J-type instructions and 8 M-extension multiply/divide operations. The design follows a classic datapath + control-unit architecture with a unified register file, immediate generation, and memory interface.',
      'Synthesized on an Altera Cyclone V FPGA at 60.42 MHz with 52 mW dynamic power and approximately 1 CPI for the implemented instruction set. Verified with self-checking Verilog testbenches achieving a 100% pass rate, plus GTKWave waveform debugging and Icarus Verilog simulation.',
    ],
    specs: [
      { label: 'ISA', value: 'RV32IM (47 base + 8 M-ext)' },
      { label: 'Architecture', value: 'Single-cycle' },
      { label: 'FPGA', value: 'Altera Cyclone V' },
      { label: 'Max Frequency', value: '60.42 MHz' },
      { label: 'Dynamic Power', value: '52 mW' },
      { label: 'CPI', value: '~1' },
      { label: 'Verification', value: 'Self-checking testbenches, GTKWave' },
    ],
    highlights: [
      'Full RV32I decode and execute for R, I, S, B, U, and J-type instructions',
      'M-extension hardware multiply and divide unit',
      'Quartus Prime synthesis with timing closure at 60+ MHz',
      'Simulation pipeline with Icarus Verilog and GTKWave debug',
    ],
    visuals: [
      { type: 'image', src: '../brand_assets/RISC-V-logo-square.svg.avif', alt: 'RISC-V logo', caption: 'RISC-V architecture', contain: true },
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
    github: null,
    docs: [],
    overview: [
      'AXI4-Lite memory-mapped coprocessor with a 4×4 systolic array (16 MAC processing elements) that computes C = A × B on fixed 32-bit integer matrices. Integrated with the RV32IM processor at base address 0x1000_0000, with matrix operands, control, status, and result registers exposed over a 12-bit address map.',
      'The compute core finishes in 6 cycles once operands are loaded, but end-to-end latency is dominated by single-beat AXI4-Lite I/O — 48 words moved one transaction at a time by the CPU. Kernel speedup is 175× (1050 → 6 cycles); end-to-end speedup is 10.9× (1110 → 102 cycles).',
    ],
    specs: [],
    specSections: [
      {
        title: 'Interface',
        specs: [
          { label: 'Protocol', value: 'AXI4-Lite (slave)' },
          { label: 'Channels', value: 'AW, W, B, AR, R (all 5)' },
          { label: 'Address width', value: '12-bit (s_awaddr / s_araddr)' },
          { label: 'Data width', value: '32-bit' },
          { label: 'Write strobe', value: '4-bit (s_wstrb)' },
          { label: 'Response codes', value: "BRESP / RRESP = 2'b00 (OKAY)" },
          { label: 'Write handshake', value: 'AWREADY = WREADY = 1 (zero backpressure)' },
          { label: 'Read handshake', value: 'Combinational, zero-latency (RVALID = ARVALID)' },
          { label: 'Base address', value: '0x1000_0000' },
        ],
      },
      {
        title: 'Register / Address Map',
        table: {
          headers: ['Offset', 'Name', 'Access', 'Description'],
          rows: [
            ['0x000–0x03C', 'Matrix A', 'Write', '16 × 32-bit words'],
            ['0x040–0x07C', 'Matrix B', 'Write', '16 × 32-bit words'],
            ['0x080', 'Control', 'R/W', 'bit0 = START (1-cycle pulse, auto-clears)'],
            ['0x084', 'Status', 'Read', 'bit1 = DONE (sticky), bit0 = BUSY'],
            ['0x088–0x0C4', 'Result C', 'Read', '16 × 32-bit words'],
          ],
        },
      },
      {
        title: 'Compute Core',
        specs: [
          { label: 'Engine', value: '4×4 systolic array' },
          { label: 'Processing elements', value: '16 PEs (one 32-bit MAC each)' },
          { label: 'Matrix size', value: 'Fixed 4×4' },
          { label: 'Data type', value: '32-bit integer' },
          { label: 'Operation', value: 'C = A × B' },
          { label: 'Compute latency', value: '6 cycles' },
          { label: 'Result capture', value: 'Snapshot into result_c on DONE' },
        ],
      },
      {
        title: 'Performance',
        specs: [
          { label: 'Kernel speedup vs SW', value: '175× (1050 → 6 cycles)' },
          { label: 'End-to-end speedup', value: '10.9× (1110 → 102 cycles)' },
          { label: 'End-to-end bottleneck', value: 'AXI single-beat I/O (data movement)' },
        ],
      },
      {
        title: 'Synthesis (Cyclone V 5CGXFC7C7F23C8, Quartus 25.1 Lite)',
        specs: [
          { label: 'Fmax (sign-off, slow 0°C)', value: '63.8 MHz' },
          { label: 'Fmax (slow 85°C)', value: '65.35 MHz' },
          { label: 'ALMs', value: '1,411 / 56,480 (2%)' },
          { label: 'Registers', value: '2,772' },
          { label: 'DSP blocks', value: '32 / 156 (21%)' },
          { label: 'Block RAM', value: '0 bits' },
          { label: 'PLLs', value: '0' },
        ],
      },
      {
        title: 'Power (PowerPlay, vectorless)',
        specs: [
          { label: 'Core dynamic', value: '23.0 mW @ 100 MHz' },
          { label: 'Core static', value: '349.6 mW' },
          { label: 'I/O', value: '4.8 mW' },
          { label: 'Total thermal', value: '377.4 mW' },
        ],
      },
      {
        title: 'Verification',
        specs: [
          { label: 'Method', value: 'Self-checking testbenches (Icarus Verilog)' },
          { label: 'Functional result', value: '16/16 elements correct (PASS)' },
          { label: 'Levels', value: 'Standalone accelerator TB + full system TB' },
        ],
      },
    ],
    cycleBreakdown: {
      title: 'End-to-End Cycle Breakdown',
      intro: 'The 6-cycle compute latency is only the systolic matmul once operands are loaded and START is pulsed. End-to-end latency is ~102 cycles because the CPU moves 48 words across the bus one at a time.',
      headers: ['Phase', 'Cycles', 'Why'],
      rows: [
        ['Write Matrix A', '~16', '16 words × 1 store each'],
        ['Write Matrix B', '~16', '16 words × 1 store each'],
        ['Write START', '~1', 'One control write'],
        ['Compute', '6', 'Systolic matmul'],
        ['Poll DONE', 'a few', 'Read status until done'],
        ['Read Matrix C', '~16', '16 words × 1 load'],
        ['Store C to memory', '~16', '16 words × 1 store'],
        ['Pointer / loop setup', 'a handful', 'Addressing overhead'],
      ],
      summary:       'Only 6 of ~102 cycles are compute. The other ~94 are the CPU shuffling 48 words over single-beat AXI4-Lite — one instruction per word.',
    },
    analysis: [
      'AXI4-Lite is single-beat: every word is its own independent transaction with separate address and data handshakes. The accelerator finishes the math almost instantly and then waits while the CPU spoon-feeds it data.',
      'This is a textbook Amdahl\'s Law case — the 6-cycle kernel got 175× faster, but it was already a tiny fraction of total latency, so system speedup is 10.9×. Data movement is now the dominant cost.',
      'The fix is burst transfers or DMA (AXI4 full): move all 16 words in one transaction instead of 16 separate bus trips. That is the natural next step to push end-to-end speedup well beyond 10.9×.',
    ],
    highlights: [
      '175× kernel speedup — systolic array vs software matmul',
      '10.9× end-to-end speedup with full CPU + accelerator integration',
      'Profiled system and identified AXI single-beat I/O as the bottleneck',
      '63.8 MHz sign-off timing on Cyclone V with 32 DSP blocks utilized',
      '16/16 elements verified across standalone and full-system testbenches',
    ],
    visuals: [
      { type: 'image', src: '../brand_assets/axi4_usethisone.png', alt: 'RV32IM CPU + 4x4 matrix accelerator architecture', caption: 'System architecture — CPU, address decoder, and 4×4 PE array', contain: true },
      { type: 'image', src: '../brand_assets/axi-matrix-cover.png', alt: 'RV32IM CPU + 4x4 matrix accelerator writeup', caption: 'Project writeup' },
    ],
  },

  'instrument-bridge': {
    num: '03',
    slug: 'instrument-bridge',
    file: 'instrument-bridge.html',
    title: 'Multi-Protocol Instrument Bridge',
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
    overview: [
      'A USB CDC adapter for I2C, SPI, UART, and bit-banged 1-Wire. The host sees a virtual serial port and sends newline-terminated text commands; firmware executes the corresponding bus transactions and replies with OK, ERR, or TIMEOUT prefixes.',
      'Built as an internal bench tool for hardware validation. The command parser in command.c is written in portable C with no SDK dependencies — host-side parser tests link against fake bus backends in tests/parser_tests.c, so grammar and reply formatting are testable without hardware. Hardware-specific code lives behind include/bridge/bus.h, the portability boundary for future MCU backends.',
    ],
    specs: [],
    designFlow: {
      title: 'Data Flow',
      text: `PC terminal or script
        |
        | USB CDC text lines
        v
stdio USB
        |
        v
line_editor.c  ->  command.c  ->  bus.h  ->  bus_pico.c
                                              |
                                              v
                                    I2C / SPI / UART / 1-Wire`,
    },
    specSections: [
      {
        title: 'Firmware Modules',
        table: {
          headers: ['Module', 'Responsibility'],
          rows: [
            ['src/main.c', 'Boots USB stdio, initializes buses, runs the command loop'],
            ['src/line_editor.c', 'Collects characters into newline-terminated command strings'],
            ['src/command.c', 'Tokenizes commands, validates args, dispatches ops, formats replies'],
            ['include/bridge/bus.h', 'Bus abstraction used by the parser and host tests'],
            ['src/bus_pico.c', 'RP2040 I2C, SPI, UART, GPIO, and 1-Wire implementation'],
            ['tests/parser_tests.c', 'Host-side parser tests with fake bus functions'],
          ],
          plain: true,
        },
      },
      {
        title: 'Hardware Target (RP2040)',
        table: {
          headers: ['Protocol', 'Signal', 'GPIO'],
          rows: [
            ['I2C0', 'SDA / SCL', 'GP4 / GP5'],
            ['SPI0', 'MISO / CS / SCK / MOSI', 'GP16 / GP17 / GP18 / GP19'],
            ['UART0', 'TX / RX', 'GP0 / GP1'],
            ['1-Wire', 'DQ', 'GP22'],
          ],
          plain: true,
        },
      },
      {
        title: 'Capabilities',
        specs: [
          { label: 'I2C', value: 'Bus scan, read, write, repeated-start write-read' },
          { label: 'SPI', value: 'Full-duplex transfers with chip-select control' },
          { label: 'UART', value: 'Configurable baud, byte-level read and write (8N1)' },
          { label: '1-Wire', value: 'Bit-banged reset, read, write' },
          { label: 'Number formats', value: 'Decimal, hex (0x1A), octal, binary (0b11010)' },
          { label: 'Max transfer', value: '64 bytes (bounded RAM and blocking time)' },
          { label: 'Reply prefixes', value: 'OK, ERR, TIMEOUT' },
        ],
      },
      {
        title: 'Command Examples',
        table: {
          headers: ['Command', 'Description'],
          rows: [
            ['i2c scan', 'Scan I2C bus for devices'],
            ['i2c read 0x68 6', 'Read 6 bytes from device 0x68'],
            ['i2c wr 0x68 2 0x75', 'Write-read sequence'],
            ['spi xfer 0x9F 0x00 0x00 0x00', 'Full-duplex SPI transfer'],
            ['uart speed 115200', 'Set UART baud rate'],
            ['ow reset / ow read 8', '1-Wire reset and read'],
          ],
          plain: true,
        },
      },
      {
        title: 'Build & Test',
        specs: [
          { label: 'Firmware build', value: 'cmake -S . -B build && cmake --build build' },
          { label: 'Flash artifact', value: 'build/probebridge.uf2' },
          { label: 'Host parser tests', value: 'cmake -DBRIDGE_HOST_TESTS=ON (no Pico SDK required)' },
          { label: 'Documentation', value: 'Markdown docs + LaTeX manual (docs/latex/manual.tex)' },
        ],
      },
    ],
    analysis: [
      'The core design splits a portable command layer from a replaceable bus backend. command.c owns user-facing syntax and validation; bus_pico.c owns RP2040 peripheral setup and transactions; bus.h is the contract that lets you swap in an STM32 backend without touching the parser.',
      'Text commands over USB CDC trade throughput for bench usability — readable, scriptable, and debuggable from any terminal. Transfer payloads are capped at 64 bytes to keep RAM use and accidental long-blocking commands bounded.',
      'Host-testable parser tests are the key architectural choice: command grammar and reply formatting are verified on the build machine before flashing, using fake bus functions that mirror the bus.h interface.',
    ],
    highlights: [
      'USB CDC virtual serial — no custom driver install required',
      'SDK-independent command parser, host-testable without hardware',
      'bus.h portability boundary for future STM32 or other MCU backends',
      'I2C, SPI, UART, and 1-Wire from one RP2040 board',
      'Formal docs: architecture, command reference, bring-up guide, LaTeX manual',
    ],
    visuals: [
      { type: 'image', src: '../brand_assets/rp2040-removebg-preview.png', alt: 'RP2040-Zero board', caption: 'RP2040 development board', contain: true },
    ],
  },

  'fes-ocpd': {
    num: '04',
    slug: 'fes-ocpd',
    file: 'fes-ocpd.html',
    title: 'Overcurrent Protection Device, FES Hardware',
    summary: 'Analog overcurrent detection for biphasic FES device using an op-amp integrator, window comparator, and SR-latch. During overcurrent events, interrupts sent to MCU, resulting in LOW state (no current delivered to patient). Helps keep patients safe while helping their lower limb musculature.',
    tools: ['KiCad', 'Altium', 'LTspice', 'CMOS Logic', 'Circuit Design'],
    status: null,
    github: null,
    docs: [],
    overview: [
      'Overcurrent protection signal chain for a functional electrical stimulation (FES) device developed with Insight Wisconsin in collaboration with the UW Health Orthotics and Prosthetics clinic. The circuit detects overcurrent events and sends an EXTI interrupt to the MCU to halt stimulation.',
      'The design uses an op-amp integrator, window comparator, and SR-latch. Threshold windows were characterized in LTspice, tuning V_H and V_L for correct triggering across expected current profiles. Schematic captured in KiCad and integrated into the overall biphasic FES device.',
    ],
    specs: [
      { label: 'Signal Chain', value: 'Integrator → Window Comparator → SR Latch' },
      { label: 'MCU Interface', value: 'EXTI interrupt on fault' },
      { label: 'Simulation', value: 'LTspice threshold characterization' },
      { label: 'Schematic', value: 'KiCad' },
      { label: 'Application', value: 'Biphasic FES medical device' },
    ],
    highlights: [
      'Detects overcurrent and halts stimulation to protect the patient',
      'Presented at Insight Design Reviews in F25 and SP26',
      'Threshold windows tuned in LTspice for expected current profiles',
      'Integrated into club FES hardware alongside UW Health O&P clinic',
    ],
    visuals: [
      { type: 'image', src: '../brand_assets/ltspice.png', alt: 'LTspice overcurrent protection schematic', caption: 'LTspice simulation — overcurrent thresholds' },
    ],
  },

  'n-body': {
    num: '05',
    slug: 'n-body',
    file: 'n-body.html',
    title: 'N-Body Gravity Simulator',
    summary: 'A program that simulates N-bodies with real-time trajectory visualization and Newtonian physics built at a small-scale. Allows speed up/slow down, FPS monitoring, and has JSON configurable bodies.',
    tools: ['Python', 'Matplotlib', 'Pandas', 'NumPy', 'ODEs', 'JSON'],
    status: null,
    github: 'https://github.com/rohtakpat314/N-Body-Gravity-Simulator',
    docs: [
      { label: 'Technical Documentation', href: '../brand_assets/N-Body%20Gravity%20Simulator%20(DOCUMENTATION).pdf' },
    ],
    overview: [
      'Simulates gravitational orbits for N bodies using Newtonian physics and numerical ODE integration. Visualizes orbit trajectories and gravitational clustering in real time with Matplotlib.',
      'Initial conditions and body parameters are loaded from JSON configuration files, making it easy to set up new simulation scenarios without modifying core code.',
    ],
    specs: [
      { label: 'Physics Model', value: 'Newtonian gravitation' },
      { label: 'Integration', value: 'Numerical ODE solver' },
      { label: 'Visualization', value: 'Matplotlib real-time plots' },
      { label: 'Configuration', value: 'JSON input files' },
    ],
    highlights: [
      'Real-time orbit trajectory and clustering visualization',
      'Configurable N-body scenarios via JSON',
      'Full technical documentation with methodology and results',
    ],
    visuals: [
      { type: 'image', src: '../brand_assets/Nbody.png', alt: 'N-Body simulation output', caption: 'Orbit trajectory visualization' },
    ],
  },

  'arcade': {
    num: '06',
    slug: 'arcade',
    file: 'arcade.html',
    title: '8×8 NeoPixel Mini Arcade',
    summary: 'A mini-arcade built using a WS2812B and ATmega328P / Arduino UNO. Hand-soldered, designed with EasyEDA, and implemented on perfboard. Players can play Snake, Ping Pong, and more.',
    tools: ['C++', 'ATmega328P', 'WS2812B NeoPixel', 'PCB Design', 'Soldering'],
    status: null,
    github: 'https://github.com/rohtakpat314/ece210-final-project',
    docs: [
      { label: 'ECE 210 Report', href: '../brand_assets/Patwardhan_Rohtak_ECE210.pdf' },
    ],
    overview: [
      'A playable arcade console on an 8×8 NeoPixel LED matrix (WS2812B) driven by an ATmega328P MCU. Implements Snake, Pong, and Flappy Bird with a menu-driven game selector — all on 64 pixels and two push buttons.',
      'Built with a custom 8-bit instruction set for display control and state management, separating game logic from rendering. Hand-soldered PCB assembled in a single 7-hour lab session for ECE 210.',
    ],
    specs: [
      { label: 'MCU', value: 'ATmega328P (32 KB flash, 2 KB RAM)' },
      { label: 'Display', value: '8×8 WS2812B NeoPixel matrix' },
      { label: 'Games', value: 'Snake, Pong, Flappy Bird' },
      { label: 'Input', value: '2 push buttons' },
      { label: 'Refresh Rate', value: '~60 FPS' },
      { label: 'Button Latency', value: '<50 ms' },
    ],
    highlights: [
      'Custom 8-bit ISA for display control and game state transitions',
      'Console-style menu to switch between three games without reflashing',
      'Real-time NeoPixel rendering with precise timing requirements',
      'Full hardware build: schematic, soldering, and integration debug',
    ],
    visuals: [
      { type: 'video', src: '../brand_assets/IMG_5784.MOV', alt: 'Arcade gameplay demo', caption: 'Gameplay demo' },
      { type: 'image', src: '../brand_assets/8x8led1.png', alt: '8x8 LED matrix board', caption: 'Assembled hardware' },
      { type: 'image', src: '../brand_assets/ledmatrix2.png', alt: 'LED matrix close-up', caption: 'NeoPixel matrix close-up' },
    ],
  },
};

const PROJECT_ORDER = [
  'riscv-cpu',
  'axi-matrix',
  'instrument-bridge',
  'fes-ocpd',
  'n-body',
  'arcade',
];
