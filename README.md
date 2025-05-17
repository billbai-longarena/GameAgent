This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Using start.sh Script

A utility script `start.sh` is available in the root directory of the `gameAgent` project (not inside the `gagent` subdirectory). This script helps in starting the development server by:
1. Checking if port 3000 is in use.
2. If the port is occupied, it attempts to stop the process using it.
3. Navigating into the `gagent` directory.
4. Running `npm run dev` to start the project.

To use the script:
1. Make sure you are in the `gameAgent` root directory (the parent directory of `gagent`).
2. Give the script execute permissions (if you haven't already):
   ```bash
   chmod +x start.sh
   ```
3. Run the script:
   ```bash
   ./start.sh
   ```

## Running Tests

To run the unit tests for this project, use the following command:

```bash
npm run test
```

This will execute the Jest test runner and display the results in your terminal. Make sure you have installed all development dependencies, including `jest-environment-jsdom`, by running `npm install`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
