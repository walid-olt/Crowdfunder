import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Investment, Project, User } from "../models/index.js";
import { hashPassword } from "../utils/password.js";

type SeedConfig = {
	owners: number;
	investors: number;
	admins: number;
	minProjectsPerOwner: number;
	maxProjectsPerOwner: number;
	minTargetCapital: number;
	maxTargetCapital: number;
	minMaxInvestmentPercentage: number;
	maxMaxInvestmentPercentage: number;
	minOwnerInvestmentPct: number;
	maxOwnerInvestmentPct: number;
	minInvestmentAmount: number;
	maxInvestorBalance: number;
	minInvestorsPerProject: number;
	maxInvestorsPerProject: number;
	clearFirst: boolean;
	seed?: number;
};

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

const getNumber = (
	args: CliArgs,
	key: string,
	envKey: string,
	fallback: number,
): number => {
	const fromArg = args[key];
	const raw = typeof fromArg === "string" ? fromArg : process.env[envKey];
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const getBoolean = (
	args: CliArgs,
	key: string,
	envKey: string,
	fallback: boolean,
): boolean => {
	const fromArg = args[key];
	const raw =
		fromArg === true
			? "true"
			: typeof fromArg === "string"
				? fromArg
				: process.env[envKey];

	if (raw === undefined) {
		return fallback;
	}

	return ["1", "true", "yes", "y", "on"].includes(raw.toLowerCase());
};

const toConfig = (args: CliArgs): SeedConfig => {
	const minProjectsPerOwner = getNumber(
		args,
		"min-projects-per-owner",
		"SEED_MIN_PROJECTS_PER_OWNER",
		1,
	);
	const maxProjectsPerOwner = getNumber(
		args,
		"max-projects-per-owner",
		"SEED_MAX_PROJECTS_PER_OWNER",
		4,
	);
	const minTargetCapital = getNumber(
		args,
		"min-target-capital",
		"SEED_MIN_TARGET_CAPITAL",
		15000,
	);
	const maxTargetCapital = getNumber(
		args,
		"max-target-capital",
		"SEED_MAX_TARGET_CAPITAL",
		350000,
	);
	const minOwnerInvestmentPct = getNumber(
		args,
		"min-owner-investment-pct",
		"SEED_MIN_OWNER_INVESTMENT_PCT",
		5,
	);
	const maxOwnerInvestmentPct = getNumber(
		args,
		"max-owner-investment-pct",
		"SEED_MAX_OWNER_INVESTMENT_PCT",
		20,
	);

	const resolvedSeed = Number(args.seed ?? process.env.SEED_RANDOM_SEED);

	const config: SeedConfig = {
		owners: getNumber(args, "owners", "SEED_OWNERS", 8),
		investors: getNumber(args, "investors", "SEED_INVESTORS", 40),
		admins: getNumber(args, "admins", "SEED_ADMINS", 1),
		minProjectsPerOwner,
		maxProjectsPerOwner: Math.max(maxProjectsPerOwner, minProjectsPerOwner),
		minTargetCapital,
		maxTargetCapital: Math.max(maxTargetCapital, minTargetCapital),
		minMaxInvestmentPercentage: getNumber(
			args,
			"min-max-investment-percentage",
			"SEED_MIN_MAX_INVESTMENT_PERCENTAGE",
			20,
		),
		maxMaxInvestmentPercentage: getNumber(
			args,
			"max-max-investment-percentage",
			"SEED_MAX_MAX_INVESTMENT_PERCENTAGE",
			50,
		),
		minOwnerInvestmentPct,
		maxOwnerInvestmentPct: Math.max(maxOwnerInvestmentPct, minOwnerInvestmentPct),
		minInvestmentAmount: getNumber(
			args,
			"min-investment-amount",
			"SEED_MIN_INVESTMENT_AMOUNT",
			300,
		),
		maxInvestorBalance: getNumber(
			args,
			"max-investor-balance",
			"SEED_MAX_INVESTOR_BALANCE",
			200000,
		),
		minInvestorsPerProject: getNumber(
			args,
			"min-investors-per-project",
			"SEED_MIN_INVESTORS_PER_PROJECT",
			3,
		),
		maxInvestorsPerProject: getNumber(
			args,
			"max-investors-per-project",
			"SEED_MAX_INVESTORS_PER_PROJECT",
			12,
		),
		clearFirst: getBoolean(args, "clear-first", "SEED_CLEAR_FIRST", true),
	};

	if (Number.isFinite(resolvedSeed)) {
		config.seed = resolvedSeed;
	}

	return config;
};

const buildProjectTitle = (): string => {
	const adjectives = [
		"Community",
		"Smart",
		"Sustainable",
		"Urban",
		"Rural",
		"Digital",
		"Green",
		"Adaptive",
	];
	const nouns = [
		"Logistics",
		"Marketplace",
		"Solar Grid",
		"Health Platform",
		"Education Hub",
		"Agri Initiative",
		"Fintech Suite",
		"Mobility Service",
	];
	return `${faker.helpers.arrayElement(adjectives)} ${faker.helpers.arrayElement(nouns)}`;
};

const clearCollections = async (): Promise<void> => {
	await Promise.all([
		Investment.deleteMany({}),
		Project.deleteMany({}),
		User.deleteMany({}),
	]);
};

const seedUsers = async (config: SeedConfig): Promise<{
	admins: Awaited<ReturnType<typeof User.create>>;
	owners: Awaited<ReturnType<typeof User.create>>;
	investors: Awaited<ReturnType<typeof User.create>>;
}> => {
	const adminPassword = await hashPassword("Admin#12345");
	const ownerPassword = await hashPassword("Owner#12345");
	const investorPassword = await hashPassword("Investor#12345");

	const adminsPayload = Array.from({ length: config.admins }, () => ({
		name: faker.person.fullName(),
		email: faker.internet.email().toLowerCase(),
		password: adminPassword,
		role: "ADMIN" as const,
		balance: 0,
	}));

	const ownersPayload = Array.from({ length: config.owners }, () => ({
		name: faker.person.fullName(),
		email: faker.internet.email().toLowerCase(),
		password: ownerPassword,
		role: "OWNER" as const,
		balance: faker.number.int({ min: 20000, max: 120000 }),
	}));

	const investorsPayload = Array.from({ length: config.investors }, () => ({
		name: faker.person.fullName(),
		email: faker.internet.email().toLowerCase(),
		password: investorPassword,
		role: "INVESTOR" as const,
		balance: faker.number.int({ min: 5000, max: config.maxInvestorBalance }),
	}));

	const [admins, owners, investors] = await Promise.all([
		User.create(adminsPayload),
		User.create(ownersPayload),
		User.create(investorsPayload),
	]);

	return { admins, owners, investors };
};

const seedProjectsAndInvestments = async (
	owners: Awaited<ReturnType<typeof User.create>>,
	investors: Awaited<ReturnType<typeof User.create>>,
	config: SeedConfig,
): Promise<{
	projectsCount: number;
	investmentsCount: number;
	closedProjectsCount: number;
}> => {
	const projectsPayload: Array<{
		title: string;
		description: string;
		targetCapital: number;
		currentCapital: number;
		ownerId: mongoose.Types.ObjectId;
		status: "OPEN" | "CLOSED";
		maxInvestmentPercentage: number;
		ownerInvestment: number;
	}> = [];

	for (const owner of owners) {
		const totalProjects = faker.number.int({
			min: config.minProjectsPerOwner,
			max: config.maxProjectsPerOwner,
		});

		for (let index = 0; index < totalProjects; index += 1) {
			const targetCapital = faker.number.int({
				min: config.minTargetCapital,
				max: config.maxTargetCapital,
			});
			const maxInvestmentPercentage = faker.number.int({
				min: config.minMaxInvestmentPercentage,
				max: config.maxMaxInvestmentPercentage,
			});

			const ownerInvestmentPct = faker.number.int({
				min: config.minOwnerInvestmentPct,
				max: Math.min(config.maxOwnerInvestmentPct, 60),
			});
			const ownerInvestment = Math.floor((targetCapital * ownerInvestmentPct) / 100);

			projectsPayload.push({
				title: buildProjectTitle(),
				description: faker.company.catchPhrase() + ". " + faker.lorem.paragraph(),
				targetCapital,
				currentCapital: ownerInvestment,
				ownerId: owner._id,
				status: ownerInvestment >= targetCapital ? "CLOSED" : "OPEN",
				maxInvestmentPercentage,
				ownerInvestment,
			});
		}
	}

	const projects = await Project.create(projectsPayload);

	let investmentsCount = 0;

	for (const project of projects) {
		if (project.status === "CLOSED") {
			continue;
		}

		const remainingStart = project.targetCapital - project.currentCapital;
		if (remainingStart <= 0) {
			continue;
		}

		const shuffledInvestors = faker.helpers.shuffle(investors);
		const investorsToUse = shuffledInvestors.slice(
			0,
			faker.number.int({
				min: config.minInvestorsPerProject,
				max: Math.min(config.maxInvestorsPerProject, investors.length),
			}),
		);

		let remaining = remainingStart;
		const investmentsPayload: Array<{
			projectId: mongoose.Types.ObjectId;
			investorId: mongoose.Types.ObjectId;
			amount: number;
		}> = [];

		for (const investor of investorsToUse) {
			if (remaining <= 0) {
				break;
			}

			const investorCapByProject = Math.floor(
				(project.targetCapital * project.maxInvestmentPercentage) / 100,
			);
			const maxInvestable = Math.min(investor.balance ?? 0, investorCapByProject, remaining);
			if (maxInvestable < config.minInvestmentAmount) {
				continue;
			}

			const amount = faker.number.int({
				min: config.minInvestmentAmount,
				max: maxInvestable,
			});

			investmentsPayload.push({
				projectId: project._id,
				investorId: investor._id,
				amount,
			});

			remaining -= amount;
			investor.balance = Math.max((investor.balance ?? 0) - amount, 0);
		}

		if (investmentsPayload.length > 0) {
			await Investment.create(investmentsPayload);
			investmentsCount += investmentsPayload.length;
		}

		project.currentCapital = project.targetCapital - remaining;
		if (project.currentCapital >= project.targetCapital) {
			project.status = "CLOSED";
		}
		await project.save();
	}

	await Promise.all(investors.map((investor) => investor.save()));

	const closedProjectsCount = projects.filter(
		(project) => project.status === "CLOSED",
	).length;

	return {
		projectsCount: projects.length,
		investmentsCount,
		closedProjectsCount,
	};
};

const run = async (): Promise<void> => {
	const args = parseCliArgs();
	const config = toConfig(args);

	if (config.seed !== undefined) {
		faker.seed(config.seed);
	}

	await connectDB();

	if (config.clearFirst) {
		await clearCollections();
	}

	const { admins, owners, investors } = await seedUsers(config);
	const { projectsCount, investmentsCount, closedProjectsCount } =
		await seedProjectsAndInvestments(owners, investors, config);

	console.log("Database seeded successfully");
	console.table({
		admins: admins.length,
		owners: owners.length,
		investors: investors.length,
		projects: projectsCount,
		investments: investmentsCount,
		closedProjects: closedProjectsCount,
		openProjects: projectsCount - closedProjectsCount,
	});
	console.log("Default passwords -> ADMIN: Admin#12345 | OWNER: Owner#12345 | INVESTOR: Investor#12345");
};

run()
	.catch((error) => {
		console.error("Seeding failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.disconnect();
	});
