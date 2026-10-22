import { cp, copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const outputDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const sharedDirectories = ["assets", "css", "javascript", "typography"];
const sharedFiles = [
	"about.html",
	"contact.html",
	"event-detail.html",
	"host-event.html",
	"index.html",
	"log-in.html",
	"map.html",
	"user-profile.html",
	"events.json",
	"manifest.webmanifest",
	"service-worker.js"
];

// Copia los recursos que comparten las páginas estáticas con Explorar.
await Promise.all(sharedDirectories.map((directory) => cp(
	join(projectRoot, directory),
	join(outputDirectory, directory),
	{ recursive: true, force: true }
)));
await mkdir(outputDirectory, { recursive: true });
await Promise.all(sharedFiles.map((file) => copyFile(
	join(projectRoot, file),
	join(outputDirectory, file)
)));
