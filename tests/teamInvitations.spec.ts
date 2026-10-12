import { test, expect } from '@playwright/test';
import { InvitationClient } from '../src/api/invitationClient';

test.describe('Uzera Plan-Based Team Member Invitations', () => {
  let client: InvitationClient;

  test.beforeEach(async ({ request }) => {
    const isolatedWorkspaceId = `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    client = new InvitationClient(request, isolatedWorkspaceId);
    await client.resetWorkspace();
  });

  test('Free Plan: successfully allows up to 2 member invitations', async () => {
    const res1 = await client.sendInvitation('member1@test.com');
    expect(res1.status()).toBe(201);
    const body1 = await res1.json();
    expect(body1).toMatchObject({ email: 'member1@test.com', status: 'pending' });

    const res2 = await client.sendInvitation('member2@test.com');
    expect(res2.status()).toBe(201);

    const listRes = await client.getInvitations();
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.totalCount).toBe(2);
    expect(listBody.invitations).toHaveLength(2);
  });

  test('Free Plan: rejects 3rd invitation with 403 Forbidden', async () => {
    await client.sendInvitation('user1@test.com');
    await client.sendInvitation('user2@test.com');

    const excessRes = await client.sendInvitation('user3@test.com');
    expect(excessRes.status()).toBe(403);
    const errBody = await excessRes.json();
    expect(errBody).toEqual({
      error: 'LIMIT_EXCEEDED',
      message: 'Free plan allows up to 2 team member invites.',
    });

    const list = await (await client.getInvitations()).json();
    expect(list.totalCount).toBe(2);
  });

  test('Free Plan: revoking an invite frees a slot for a new member', async () => {
    const res1 = await client.sendInvitation('active1@test.com');
    await client.sendInvitation('active2@test.com');
    const { id } = await res1.json();

    const delRes = await client.revokeInvitation(id);
    expect(delRes.status()).toBe(200);

    const listAfterDel = await (await client.getInvitations()).json();
    expect(listAfterDel.totalCount).toBe(1);

    const newRes = await client.sendInvitation('replacement@test.com');
    expect(newRes.status()).toBe(201);
    expect((await newRes.json()).email).toBe('replacement@test.com');
  });

  test('Premium Plan: allows inviting beyond 2 members without restriction', async () => {
    await client.setPlan('Premium');

    const emails = [
      'premium1@test.com',
      'premium2@test.com',
      'premium3@test.com',
      'premium4@test.com',
    ];

    for (const email of emails) {
      const res = await client.sendInvitation(email);
      expect(res.status()).toBe(201);
    }

    const list = await (await client.getInvitations()).json();
    expect(list.plan).toBe('Premium');
    expect(list.totalCount).toBe(4);
  });

  test('Lifecycle: an accepted invite remains counted toward the limit and is reportable', async () => {
    const invite = await client.sendInvitation('memberA@test.com');
    expect(invite.status()).toBe(201);

    const { id } = await invite.json();
    const acceptRes = await client.acceptInvitation(id);
    expect(acceptRes.status()).toBe(200);

    const acceptedBody = await acceptRes.json();
    expect(acceptedBody.status).toBe('accepted');

    const list = await (await client.getInvitations()).json();
    expect(list.totalCount).toBe(1);
    expect(list.invitations[0].status).toBe('accepted');

    const blockedRes = await client.sendInvitation('memberB@test.com');
    expect(blockedRes.status()).toBe(201);
    const res3 = await client.sendInvitation('memberC@test.com');
    expect(res3.status()).toBe(403);
  });

  test('Edge Case: plan upgrade immediately unblocks invitation capacity', async () => {
    await client.sendInvitation('free1@test.com');
    await client.sendInvitation('free2@test.com');

    const blockedRes = await client.sendInvitation('free3@test.com');
    expect(blockedRes.status()).toBe(403);

    const upgradeRes = await client.setPlan('Premium');
    expect(upgradeRes.status()).toBe(200);

    const retryRes = await client.sendInvitation('free3@test.com');
    expect(retryRes.status()).toBe(201);
  });

  test('Concurrency: simultaneous invites do not bypass the Free limit', async () => {
    await client.sendInvitation('seed@test.com');

    const [reqA, reqB] = await Promise.all([
      client.sendInvitation('concurrent_a@test.com'),
      client.sendInvitation('concurrent_b@test.com'),
    ]);

    const statuses = [reqA.status(), reqB.status()].sort();
    expect(statuses).toEqual([201, 403]);

    const finalState = await (await client.getInvitations()).json();
    expect(finalState.totalCount).toBe(2);
  });
});
