import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Investment, Project, User } from "../models/index.js";

type CollectionName = "users" | "projects" | "investments";

type CliArgs = {
	[key: string]: string | true;
};

const parseCliArgs = (): CliArgs => {
	const args = process.argv.slice(2);
	const parsed: CliArgs = {};

	for (const arg of args) {
		if (!arg.startsWith("--")) {
			continue;
		}

		const [key, value] = arg.replace(/^--/, "").split("=");
		if (!key) {
			continue;
		}
		parsed[key] = value ?? true;
	}

	return parsed;
};

const parseCollections = (raw?: string): CollectionName[] => {
	const available: CollectionName[] = ["users", "projects", "investments"];

	if (!raw) {
		return ["investments", "projects", "users"];
	}

	const requested = raw
		.split(",")
		.map((part) => part.trim().toLowerCase())
		.filter((part): part is CollectionName =>
			available.includes(part as CollectionName),
		);

	return requested.length > 0 ? requested : ["investments", "projects", "users"];
};

const isTruthy = (value: string | true | undefined): boolean => {
	if (value === true) {
		return true;
	}
	if (!value) {
		return false;
	}
	return ["1", "true", "yes", "y", "on"].includes(value.toLowerCase());
};

const clearCollection = async (collection: CollectionName): Promise<number> => {
	switch (collection) {
		case "investments": {
			const result = await Investment.deleteMany({});
			return result.deletedCount ?? 0;
		}
		case "projects": {
			const result = await Project.deleteMany({});
			return result.deletedCount ?? 0;
		}
		case "users": {
			const result = await User.deleteMany({});
			return result.deletedCount ?? 0;
		}
	}
};

const countCollection = async (collection: CollectionName): Promise<number> => {
	switch (collection) {
		case "investments":
			return Investment.countDocuments({});
		case "projects":
			return Project.countDocuments({});
		case "users":
			return User.countDocuments({});
	}
};

const run = async (): Promise<void> => {
	const args = parseCliArgs();
	const collections = parseCollections(
		typeof args.collections === "string"
			? args.collections
			: process.env.CLEAR_COLLECTIONS,
	);
	const dryRun = isTruthy(
		typeof args["dry-run"] === "string" || args["dry-run"] === true
			? args["dry-run"]
			: process.env.CLEAR_DRY_RUN,
	);

	await connectDB();

	if (dryRun) {
		const preview = await Promise.all(
			collections.map(async (name) => ({
				collection: name,
				currentDocuments: await countCollection(name),
			})),
		);
		console.log("Dry run enabled. No documents were deleted.");
		console.table(preview);
		return;
	}

	const resultRows: Array<{ collection: CollectionName; deletedDocuments: number }> = [];
	for (const collection of collections) {
		const deletedDocuments = await clearCollection(collection);
		resultRows.push({ collection, deletedDocuments });
	}

	console.log("Clear completed successfully");
	console.table(resultRows);
};

run()
	.catch((error) => {
		console.error("Clear failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.disconnect();
	});
