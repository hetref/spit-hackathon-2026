import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, slug, description, logo } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug is already taken
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      )
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        description: description || null,
        logo: logo || null,
        ownerId: session.user.id,
        plan: 'FREE',
        tokenUsage: 0,
        tokenLimit: 10000
      }
    })

    // Create tenant user entry for owner
    await prisma.tenantUser.create({
      data: {
        userId: session.user.id,
        tenantId: tenant.id,
        role: 'OWNER'
      }
    })

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all tenants where user is a member
    const tenantUsers = await prisma.tenantUser.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        tenant: {
          include: {
            _count: {
              select: {
                tenantUsers: true,
                sites: true
              }
            }
          }
        }
      }
    })

    const tenants = tenantUsers.map(tu => ({
      ...tu.tenant,
      userRole: tu.role
    }))

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}
