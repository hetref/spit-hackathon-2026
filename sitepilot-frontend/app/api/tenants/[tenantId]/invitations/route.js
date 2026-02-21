import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await params
    const { email, role = 'EDITOR' } = await request.json()

    // Check if user is owner or has permission
    const requestingUser = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId
        }
      }
    })

    if (!requestingUser || requestingUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can invite members' },
        { status: 403 }
      )
    }

    // Get tenant details
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check if user is already a member
    const userToInvite = await prisma.user.findUnique({
      where: { email }
    })

    if (userToInvite) {
      const existingMember = await prisma.tenantUser.findUnique({
        where: {
          userId_tenantId: {
            userId: userToInvite.id,
            tenantId
          }
        }
      })

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member' },
          { status: 409 }
        )
      }
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId
        }
      }
    })

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 409 }
      )
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        tenantId,
        invitedBy: session.user.id,
        expiresAt,
        status: 'PENDING'
      }
    })

    // Send invitation email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitations/${invitation.token}`
    const emailSent = await sendInvitationEmail({
      to: email,
      tenantName: tenant.name,
      role,
      invitationUrl,
    })

    return NextResponse.json({ 
      message: emailSent ? 'Invitation sent successfully' : 'Invitation created (email not configured)',
      invitationUrl: !emailSent ? invitationUrl : undefined,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await params

    // Check if user has access to this tenant
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId
        }
      }
    })

    if (!tenantUser || tenantUser.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        tenantId,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
