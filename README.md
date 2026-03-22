# SQL Schema Visualizer

A powerful, interactive tool to visualize PostgreSQL schemas from raw SQL code. Turn complex table relationships, triggers, functions, and RLS policies into clear, navigable diagrams.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React Flow](https://img.shields.io/badge/React%20Flow-FF4154?style=for-the-badge&logo=reactflow&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

## 🚀 Usage

1.  **Paste SQL**: Drag and drop your SQL dump or paste code directly into the editor.
2.  **Visualize**: Click "Visualize" to generate a dynamic relationship diagram.
3.  **Inspect**: Click on nodes to view metadata, SQL code, or perform **Impact Analysis**.
4.  **Filter**: Use the legend to toggle visibility for Tables, Views, Triggers, Functions, and RLS Policies.
5.  **Search**: Use the global search to quickly locate specific nodes by name or type.

## ✨ Key Features

-   **Automatic Grouping**: RLS Policies are neatly grouped by table within dedicated frames.
-   **Impact Analysis**: Instantly see which entities are affected when dropping a table or field (foreign keys, views, etc.).
-   **Smart Layout**: Powered by Dagre and React Flow for optimal non-overlapping node placement.
-   **Solo Mode**: Focus on a single node and its immediate relationships with one click.
-   **Export**: Quick screenshot functionality to save your diagram as a PNG.

## 🛠 Tech Stack

-   **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/)
-   **Diagramming**: [XY Flow (React Flow)](https://reactflow.dev/)
-   **Layout Engine**: [Dagre](https://github.com/dagrejs/dagre)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)

## 📄 License

This project is open-source and available under the **MIT License**.
