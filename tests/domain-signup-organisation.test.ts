import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDomainSignupOrganisation } from '../packages/lib/utils/domain-signup-organisation.ts';

const configuration = JSON.stringify({ 'ai.engineer': 'aie', 'latent.space': 'latent', 'smol.ai': 'smol' });

test('verified domain identities select only their matching organization', () => {
  assert.equal(getDomainSignupOrganisation('Adlin@Latent.Space', configuration), 'latent');
  assert.equal(getDomainSignupOrganisation('person@ai.engineer', configuration), 'aie');
  assert.equal(getDomainSignupOrganisation('person@smol.ai', configuration), 'smol');
});

test('owner exceptions, lookalikes and malformed addresses do not enroll in a team', () => {
  for (const email of [
    'shawnthe1@gmail.com',
    'person@sub.latent.space',
    'person@latent.space.evil',
    'person@latent.space@evil',
    '@latent.space',
  ]) {
    assert.equal(getDomainSignupOrganisation(email, configuration), undefined);
  }
});

test('empty configuration disables enrollment and invalid configuration fails closed', () => {
  assert.equal(getDomainSignupOrganisation('person@latent.space', ''), undefined);
  assert.throws(() => getDomainSignupOrganisation('person@latent.space', '{'));
  assert.throws(() => getDomainSignupOrganisation('person@latent.space', JSON.stringify({ 'latent.space': 42 })));
});
