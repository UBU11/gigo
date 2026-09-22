import { describe, expect, it } from "bun:test";
import {
	ApiErrorResponseSchema,
	AuthSessionUserSchema,
	CheckInTicketResponseSchema,
	CheckInTicketSchema,
	ClaimTicketResponseSchema,
	ClaimTicketSchema,
	CollabListResponseSchema,
	CollabPostDtoSchema,
	CreateCollabPostSchema,
	CreateCollabResponseSchema,
	CreateFeedPostSchema,
	CreateFeedResponseSchema,
	CreatePseudoProfileSchema,
	FeedListResponseSchema,
	FeedPostDtoSchema,
	InstitutionalDomainSchema,
	PseudoProfileSchema,
	PublicProfileSchema,
	TicketStatusSchema,
	TicketTokenPayloadSchema,
	UpdatePublicProfileSchema,
	UserTicketDtoSchema,
	UserTicketsResponseSchema,
} from "../src";

describe("Contracts Schema Validation", () => {
	it("validates ticket payload correctly", () => {
		const payload = {
			tid: "123e4567-e89b-12d3-a456-426614174000",
			eid: "123e4567-e89b-12d3-a456-426614174001",
			uid: "user-abc-123",
			iat: 1720000000,
			exp: 1720086400,
		};
		const result = TicketTokenPayloadSchema.safeParse(payload);
		expect(result.success).toBe(true);
	});

	it("rejects non-uuid ticket payload id", () => {
		const payload = {
			tid: "invalid-uuid",
			eid: "123e4567-e89b-12d3-a456-426614174001",
			uid: "user-abc-123",
			iat: 1720000000,
			exp: 1720086400,
		};
		const result = TicketTokenPayloadSchema.safeParse(payload);
		expect(result.success).toBe(false);
	});

	it("validates pseudo profile handle regex", () => {
		const valid = PseudoProfileSchema.safeParse({
			userId: "u1",
			pseudoHandle: "Batch26_Sparrow",
			avatarSeed: "seed123",
			reputationScore: 0,
			createdAt: new Date(),
		});
		expect(valid.success).toBe(true);

		const invalid = PseudoProfileSchema.safeParse({
			userId: "u1",
			pseudoHandle: "Batch 26! Space",
			avatarSeed: "seed123",
			reputationScore: 0,
			createdAt: new Date(),
		});
		expect(invalid.success).toBe(false);
	});

	it("validates claim ticket schema", () => {
		const valid = ClaimTicketSchema.safeParse({
			eventId: "123e4567-e89b-12d3-a456-426614174000",
		});
		expect(valid.success).toBe(true);

		const invalid = ClaimTicketSchema.safeParse({
			eventId: "not-a-uuid",
		});
		expect(invalid.success).toBe(false);
	});

	it("validates check-in ticket and status schemas", () => {
		expect(
			CheckInTicketSchema.safeParse({ ticketToken: "valid-long-token" })
				.success,
		).toBe(true);
		expect(
			CheckInTicketSchema.safeParse({
				ticketToken: "valid-long-token",
				eventId: "123e4567-e89b-12d3-a456-426614174000",
			}).success,
		).toBe(true);
		expect(
			CheckInTicketSchema.safeParse({
				ticketToken: "valid-long-token",
				eventId: "invalid-uuid",
			}).success,
		).toBe(false);
		expect(
			CheckInTicketSchema.safeParse({ ticketToken: "short" }).success,
		).toBe(false);
		expect(TicketStatusSchema.safeParse("ISSUED").success).toBe(true);
		expect(TicketStatusSchema.safeParse("INVALID").success).toBe(false);

		const validTicketDto = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			eventId: "123e4567-e89b-12d3-a456-426614174001",
			userId: "usr_1",
			status: "ISSUED",
			signedToken: "signed.jwt.token",
			checkedInAt: null,
			createdAt: new Date(),
		};
		expect(UserTicketDtoSchema.safeParse(validTicketDto).success).toBe(true);
	});

	it("validates institutional email domain schema", () => {
		expect(
			InstitutionalDomainSchema.safeParse("student@college.ac.in").success,
		).toBe(true);
		expect(
			InstitutionalDomainSchema.safeParse("student@gmail.com").success,
		).toBe(false);
	});

	it("validates auth session user schema", () => {
		const validUser = {
			id: "usr_1",
			name: "Student Name",
			email: "student@college.ac.in",
			emailVerified: true,
			image: null,
		};
		expect(AuthSessionUserSchema.safeParse(validUser).success).toBe(true);
		expect(
			AuthSessionUserSchema.safeParse({ ...validUser, email: "not-an-email" })
				.success,
		).toBe(false);
	});

	it("validates public profile and update schemas", () => {
		const profile = {
			userId: "usr_1",
			fullName: "Alex Rivera",
			department: "Computer Science",
			batchYear: 2026,
			avatarUrl: "https://example.com/avatar.png",
			updatedAt: new Date(),
		};
		expect(PublicProfileSchema.safeParse(profile).success).toBe(true);

		const update = {
			fullName: "Alex Rivera",
			department: "Computer Science",
			batchYear: 2026,
			avatarUrl: "https://example.com/avatar.png",
		};
		expect(UpdatePublicProfileSchema.safeParse(update).success).toBe(true);
	});

	it("validates pseudo profile create schema", () => {
		const create = {
			pseudoHandle: "AnonymousHawk",
			avatarSeed: "seed_42",
		};
		expect(CreatePseudoProfileSchema.safeParse(create).success).toBe(true);
	});

	it("validates feed post schemas", () => {
		expect(
			CreateFeedPostSchema.safeParse({ content: "Campus announcement!" })
				.success,
		).toBe(true);
		expect(CreateFeedPostSchema.safeParse({ content: "" }).success).toBe(false);

		const feedDto = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			content: "Hello everyone",
			tag: "general",
			authorPseudoHandle: "CampusOwl",
			authorAvatarSeed: "owl123",
			upvotes: 5,
			createdAt: new Date(),
		};
		expect(FeedPostDtoSchema.safeParse(feedDto).success).toBe(true);
	});

	it("validates collab post schemas", () => {
		const create = {
			title: "Hackathon Teammate Wanted",
			description:
				"Building an AI-powered campus tool. Need a frontend specialist.",
			requiredSkills: ["TypeScript", "React"],
		};
		expect(CreateCollabPostSchema.safeParse(create).success).toBe(true);

		const collabDto = {
			id: "123e4567-e89b-12d3-a456-426614174000",
			...create,
			ownerUserId: "usr_1",
			ownerFullName: "Alex Rivera",
			ownerDepartment: "Computer Science",
			createdAt: new Date(),
		};
		expect(CollabPostDtoSchema.safeParse(collabDto).success).toBe(true);
	});

	it("validates ApiErrorResponseSchema correctly", () => {
		const valid = ApiErrorResponseSchema.safeParse({
			success: false,
			error: "EVENT_SOLD_OUT",
		});
		expect(valid.success).toBe(true);

		const invalid = ApiErrorResponseSchema.safeParse({
			success: true,
			error: "EVENT_SOLD_OUT",
		});
		expect(invalid.success).toBe(false);
	});

	it("validates response envelopes for tickets, collab, and feed", () => {
		const ticketsValid = UserTicketsResponseSchema.safeParse({
			success: true,
			tickets: [],
		});
		expect(ticketsValid.success).toBe(true);

		const claimValid = ClaimTicketResponseSchema.safeParse({
			success: true,
			ticket: {
				id: "123e4567-e89b-12d3-a456-426614174000",
				eventId: "123e4567-e89b-12d3-a456-426614174001",
				userId: "usr_1",
				status: "ISSUED",
				signedToken: "signed.jwt.token",
				checkedInAt: null,
				createdAt: new Date(),
			},
		});
		expect(claimValid.success).toBe(true);

		const checkInValid = CheckInTicketResponseSchema.safeParse({
			success: true,
			ticket: {
				id: "123e4567-e89b-12d3-a456-426614174000",
				checkedInAt: new Date(),
			},
		});
		expect(checkInValid.success).toBe(true);

		const collabValid = CollabListResponseSchema.safeParse({
			success: true,
			projects: [],
		});
		expect(collabValid.success).toBe(true);

		const createCollabValid = CreateCollabResponseSchema.safeParse({
			success: true,
			collab: {
				id: "123e4567-e89b-12d3-a456-426614174000",
				title: "Hackathon Teammate Wanted",
				description:
					"Building an AI-powered campus tool. Need a frontend specialist.",
				requiredSkills: ["TypeScript"],
				ownerUserId: "usr_1",
				ownerFullName: "Alex Rivera",
				ownerDepartment: "Computer Science",
				createdAt: new Date(),
			},
		});
		expect(createCollabValid.success).toBe(true);

		const feedValid = FeedListResponseSchema.safeParse({
			success: true,
			posts: [],
		});
		expect(feedValid.success).toBe(true);

		const createFeedValid = CreateFeedResponseSchema.safeParse({
			success: true,
			post: {
				id: "123e4567-e89b-12d3-a456-426614174000",
				content: "Hello campus",
				tag: "general",
				authorPseudoHandle: "CampusOwl",
				authorAvatarSeed: "owl123",
				upvotes: 0,
				createdAt: new Date(),
			},
		});
		expect(createFeedValid.success).toBe(true);
	});
});
