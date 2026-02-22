import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getPresignedMediaUrl } from '@/lib/aws/s3-publish'

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
        logo: logo || null, // Store S3 key
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

    // Generate presigned URL for logo if it exists
    let tenantWithLogo = { ...tenant }
    if (tenant.logo) {
      try {
        const logoUrl = await getPresignedMediaUrl(tenant.logo, 3600)
        tenantWithLogo.logoUrl = logoUrl
      } catch (error) {
        console.error('Failed to generate presigned URL for logo:', error)
      }
    }

    return NextResponse.json({ tenant: tenantWithLogo }, { status: 201 })
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

    // Map tenants and generate presigned URLs for logos
    const tenants = await Promise.all(
      tenantUsers.map(async (tu) => {
        const tenant = {
          ...tu.tenant,
          userRole: tu.role
        }

        // Generate presigned URL for logo if it exists
        if (tenant.logo) {
          try {
            tenant.logoUrl = await getPresignedMediaUrl(tenant.logo, 3600)
          } catch (error) {
            console.error('Failed to generate presigned URL for tenant logo:', error)
          }
        }

        return tenant
      })
    )

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}
