# GitHub-Copilot-Cobol-Extension

GitHub Copilot Cobol Extension

## Description

This Visual Studio Code extension provides tools and utilities to assist with COBOL programming. It includes features for generating documentation, explaining code, and analyzing COBOL programs.

## Features

- **Explain COBOL Program**: Generate detailed explanations for COBOL programs, including program info, data division, and procedure division.
- **Generate Documentation**: Automatically generate markdown documentation for COBOL programs.
- **Analyze COBOL Code**: Chunk COBOL code into divisions, sections, and paragraphs for detailed analysis.

## Commands

The extension provides the following commands:

- `explain`: Explain the entire COBOL program.
- `info`: Extract and display information about the COBOL program.
- `data`: Explain the data division of the COBOL program.
- `procedure`: Explain the procedure division of the COBOL program.
- `gendoc`: Generate a markdown documentation file for the COBOL program.

## Installation
### Using vsix file
1. Download the latest release from the [Releases](https://github.com/microsoft/GitHub-Copilot-Cobol-Extension-Sample/releases)
2. Open Visual Studio Code.
3. Press `Ctrl+Shift+X` to open the Extensions view.
4. Click on the `...` icon in the top-right corner of the Extensions view and select `Install from VSIX...`.
5. Select the downloaded `.vsix` file and click `Install`.

Alternatively, you can install the extension using the command line:
```sh
code --install-extension path/to/GitHub-Copilot-Cobol-Extension.vsix
```

To uninstall the extension, you can use the command line:
```sh
code --uninstall-extension path/to/GitHub-Copilot-Cobol-Extension.vsix
```


### Using Code
1. Clone the repository:
    ```sh
    git clone https://github.com/your-repo/GitHub-Copilot-Cobol-Extension.git
    ```
2. Navigate to the project directory:
    ```sh
    cd GitHub-Copilot-Cobol-Extension
    ```
3. Install dependencies:
    ```sh
    npm install
    ```
4. Compile the extension:
    ```sh
    npm run compile
    ```
5. Open the project in Visual Studio Code:
    ```sh
    code .
    ```
6  Open extension.ts file and press `F5` to start debugging the extension.


## Usage

1. Open a COBOL file in Visual Studio Code.
2. Open GitHub Copilot Chat
3. type @Cobol select the command you want to run (e.g., `/explain`, `/info`, `/data`, `/procedure`, `/gendoc`).
4. Press `Enter` to execute the command.


## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](/CONTRIBUTING.md) file for guidelines on how to contribute.

## Support

For support, please refer to the [SUPPORT.md](/SUPPORT.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](/LICENSE) file for details.

## Security

For security issues, please refer to the [SECURITY.md](/SECURITY.md) file.