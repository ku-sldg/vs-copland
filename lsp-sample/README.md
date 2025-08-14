
## Functionality

This Language Server works for copland programs with the file type (.cop). It has the following language features:
- Syntax Highlighting 
- Diagnostic checking for just syntax issues

A later update will include parsing and tool support.

## Structure
The diagram below might be wrong I do not know what needs to be updated yet, ignore for now.
```
.
├── client // Language Client
│   ├── src
│   │   ├── test // End to End tests for Language Client / Server
│   │   └── extension.ts // Language Client entry point
├── package.json // The extension manifest.
└── server // Language Server
    └── src
        └── server.ts // Language Server entry point
```

## Running the Sample

- In the extensions tab (ctrl+shift+x) proceed to the three dots in the top right corner
- click install from VSIX 
- Select the vs-copland-(vers number).vsix file 
- create your (.cop) file
- HAPPY PROGRAMMING!!!!

(Please report any bugs, issues, or improvement ideas to Anakha or Molly!)