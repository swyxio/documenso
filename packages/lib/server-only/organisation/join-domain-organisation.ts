import { prisma } from '@documenso/prisma';
import {
  OrganisationGroupType,
  OrganisationMemberInviteStatus,
  OrganisationMemberRole,
  OrganisationType,
} from '@prisma/client';

import { IS_BILLING_ENABLED } from '../../constants/app';
import { isEmailDomainAllowedForSignup } from '../../constants/auth';
import { AppError, AppErrorCode } from '../../errors/app-error';
import { generateDatabaseId } from '../../universal/id';
import { getDomainSignupOrganisation } from '../../utils/domain-signup-organisation';

/** Enroll only a freshly verified Google identity in its configured native member group. */
export const joinDomainOrganisation = async ({ userId, verifiedEmail }: { userId: number; verifiedEmail: string }) => {
  const organisationId = getDomainSignupOrganisation(
    verifiedEmail,
    process.env.NEXT_PRIVATE_DOMAIN_ORGANISATIONS || '',
  );

  if (!organisationId) {
    return undefined;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (
    user.disabled ||
    !user.emailVerified ||
    user.email.toLowerCase() !== verifiedEmail.toLowerCase() ||
    !isEmailDomainAllowedForSignup(verifiedEmail)
  ) {
    throw new AppError(AppErrorCode.UNAUTHORIZED);
  }

  if (IS_BILLING_ENABLED()) {
    throw new AppError(AppErrorCode.NOT_SETUP, {
      message: 'Domain enrollment requires a billing-disabled self-hosted instance',
    });
  }

  return prisma.$transaction(async (tx) => {
    const organisation = await tx.organisation.findFirstOrThrow({
      where: { id: organisationId, type: OrganisationType.ORGANISATION },
      select: {
        groups: {
          where: { type: OrganisationGroupType.INTERNAL_ORGANISATION, organisationRole: OrganisationMemberRole.MEMBER },
        },
        teams: { take: 1, orderBy: { id: 'asc' }, select: { url: true } },
      },
    });
    const group = organisation.groups[0];
    const team = organisation.teams[0];

    if (!group || !team) {
      throw new AppError(AppErrorCode.NOT_SETUP, {
        message: 'Domain organization needs its native member group and signing team',
      });
    }

    const memberId = generateDatabaseId('member');
    // The unique user/organization key makes simultaneous or repeated sign-ins safe.
    const inserted = await tx.organisationMember.createMany({
      data: [{ id: memberId, userId, organisationId }],
      skipDuplicates: true,
    });

    if (inserted.count === 1) {
      await tx.organisationGroupMember.create({
        data: { id: generateDatabaseId('group_member'), organisationMemberId: memberId, groupId: group.id },
      });
    }

    // Existing members retain their roles; only pending Member invitations are reconciled.
    await tx.organisationMemberInvite.updateMany({
      where: {
        organisationId,
        email: { equals: verifiedEmail, mode: 'insensitive' },
        status: OrganisationMemberInviteStatus.PENDING,
        organisationRole: OrganisationMemberRole.MEMBER,
      },
      data: { status: OrganisationMemberInviteStatus.ACCEPTED },
    });

    return team.url;
  });
};
