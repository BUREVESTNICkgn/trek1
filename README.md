# Trek1

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.2.

## Development server

Start the backend API first:

```bash
npm run server
```

The server listens on `http://localhost:4000` and creates a SQLite file at `server/computer.db` on first launch. Uploaded images are stored under `uploads/` and are served via `/uploads/*` paths.

Then start the Angular dev server with the proxy to the API:

```bash
ng serve
```

With the proxy enabled, requests to `/api` and `/uploads` are forwarded to the Express server so login/registration and media loading work without CORS issues. Open `http://localhost:4200/` to develop; the application reloads automatically when source files change.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
