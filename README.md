# SAP·LAB — SAP-1 Interactive Simulator

A browser-based educational SAP-1 simulator built with HTML, CSS, and JavaScript.

## Run locally
1. Download and extract the project folder.
2. Open the folder in Visual Studio Code.
3. Open `index.html` with Live Server, or open `index.html` directly in a browser.

## Features
- Editable hexadecimal input values (00–FF)
- 16 × 8-bit RAM display
- PC, MAR, IR, A, B, and OUT register displays
- LDA, ADD, SUB, OUT, and HLT instruction execution
- Step, Run, and Reset controls
- W-Bus activity display, output LEDs, progress indicator, and execution log

## Instruction sequence
The current demonstration program is:
- `LDA 9H`
- `ADD AH`
- `SUB BH`
- `OUT`
- `HLT`

User data is loaded into RAM addresses 9H, AH, and BH.

## Technologies
- HTML for page structure
- CSS for styling and responsive layout
- JavaScript for CPU state, instruction execution, and interactive controls

No build tools or external JavaScript libraries are required. Google Fonts are used for typography; the page remains functional without them.
