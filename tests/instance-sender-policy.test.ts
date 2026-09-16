import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAllowedInstanceSender } from '../packages/lib/utils/instance-sender-policy.ts';

const domains = 'ai.engineer,latent.space,smol.ai';
const owner = 'shawnthe1@gmail.com';

test('owner and exact team domains can send', () => {
  for (const email of [owner, 'member@ai.engineer', 'member@latent.space', 'member@smol.ai', ' MEMBER@SMOL.AI ']) {
    assert.equal(isAllowedInstanceSender(email, domains, owner), true);
  }
});

test('unapproved Gmail, subdomains, suffixes, and malformed identities are rejected', () => {
  for (const email of [
    'other@gmail.com',
    'member@sub.smol.ai',
    'member@smol.ai.example.com',
    'member@evilsmol.ai',
    'shawnthe1+other@gmail.com',
    'member@smol.ai@evil.com',
    '@smol.ai',
    'member',
    '',
  ]) {
    assert.equal(isAllowedInstanceSender(email, domains, owner), false);
  }
});

test('missing allowlist fails closed and removal revokes admission', () => {
  assert.equal(isAllowedInstanceSender(owner, '', ''), false);
  assert.equal(isAllowedInstanceSender('member@smol.ai', 'ai.engineer', owner), false);
});
