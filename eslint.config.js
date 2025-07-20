import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';

export default [
  // Global ignores - ignore generated files
  {
    ignores: ['src/generated/**', '**/generated/**/*.ts', '**/*.generated.ts']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.js'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Error: 'readonly',
        TypeError: 'readonly',
        RangeError: 'readonly',
        ReferenceError: 'readonly',
        SyntaxError: 'readonly',
        EvalError: 'readonly',
        URIError: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        RegExp: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Boolean: 'readonly',
        Function: 'readonly',
        Symbol: 'readonly',
        BigInt: 'readonly',
        Uint8Array: 'readonly',
        Uint16Array: 'readonly',
        Uint32Array: 'readonly',
        Int8Array: 'readonly',
        Int16Array: 'readonly',
        Int32Array: 'readonly',
        Float32Array: 'readonly',
        Float64Array: 'readonly',
        ArrayBuffer: 'readonly',
        DataView: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        FormData: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        CustomEvent: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        Image: 'readonly',
        ImageData: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        performance: 'readonly',
        location: 'readonly',
        history: 'readonly',
        navigator: 'readonly',
        screen: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        getComputedStyle: 'readonly',
        matchMedia: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'security': security
    },
    rules: {
      ...typescript.configs['recommended'].rules,
      ...typescript.configs['recommended-requiring-type-checking'].rules,
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-unsafe-regex': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-proto': 'error',
      'no-iterator': 'error',
      'no-restricted-globals': [
        'error',
        'eval',
        'execScript'
      ],
      'no-restricted-properties': [
        'error',
        {
          'object': 'document',
          'property': 'write',
          'message': 'document.write() can lead to XSS vulnerabilities'
        },
        {
          'object': 'document',
          'property': 'writeln',
          'message': 'document.writeln() can lead to XSS vulnerabilities'
        },
        {
          'property': '__proto__',
          'message': '__proto__ usage can lead to prototype pollution'
        },
        {
          'object': 'Object',
          'property': 'setPrototypeOf',
          'message': 'Object.setPrototypeOf() can lead to prototype pollution'
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          'selector': "CallExpression[callee.name='eval']",
          'message': 'eval() is not allowed for security reasons'
        },
        {
          'selector': "NewExpression[callee.name='Function']",
          'message': 'Function constructor is not allowed for security reasons'
        },
        {
          'selector': "MemberExpression[property.name='innerHTML']",
          'message': 'innerHTML can lead to XSS vulnerabilities. Use textContent or safer DOM methods instead'
        },
        {
          'selector': "MemberExpression[property.name='outerHTML']",
          'message': 'outerHTML can lead to XSS vulnerabilities. Use safer DOM methods instead'
        },
        {
          'selector': "CallExpression[callee.property.name='insertAdjacentHTML']",
          'message': 'insertAdjacentHTML can lead to XSS vulnerabilities. Use safer DOM methods instead'
        },
        {
          'selector': "AssignmentExpression[left.property.name='href'][right.type!='Literal']",
          'message': 'Dynamic href assignment can lead to XSS. Validate URLs before assignment'
        },
        {
          'selector': "AssignmentExpression[left.property.name='src'][right.type!='Literal']",
          'message': 'Dynamic src assignment can lead to XSS. Validate URLs before assignment'
        },
        {
          'selector': "CallExpression[callee.name='setTimeout'][arguments.0.type='Literal']",
          'message': 'setTimeout with string argument is similar to eval() and can lead to code injection'
        },
        {
          'selector': "CallExpression[callee.name='setInterval'][arguments.0.type='Literal']",
          'message': 'setInterval with string argument is similar to eval() and can lead to code injection'
        },
        {
          'selector': "MemberExpression[object.name='constructor'][property.name='constructor']",
          'message': 'constructor.constructor usage can lead to prototype pollution'
        }
      ]
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        vi: 'readonly',
        test: 'readonly'
      }
    }
  }
];