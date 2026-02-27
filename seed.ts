import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a sample company
  const company = await prisma.company.create({
    data: {
      name: 'Demo Facility Management',
      email: 'admin@demo.com',
      phone: '+91-9876543210',
      address: '123 Demo Street, Mumbai, Maharashtra 400001',
    },
  })

  console.log('Created company:', company.name)

  // Create a sample location
  const location = await prisma.location.create({
    data: {
      companyId: company.id,
      name: 'Main Building',
      address: '123 Demo Street, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
  })

  console.log('Created location:', location.name)

  // Create floors
  const groundFloor = await prisma.floor.create({
    data: {
      locationId: location.id,
      floorNumber: '0',
      name: 'Ground Floor',
    },
  })

  const firstFloor = await prisma.floor.create({
    data: {
      locationId: location.id,
      floorNumber: '1',
      name: 'First Floor',
    },
  })

  console.log('Created floors')

  // Create sample staff
  const staff1 = await prisma.staff.create({
    data: {
      companyId: company.id,
      name: 'Ramesh Kumar',
      email: 'ramesh@demo.com',
      phone: '+91-9876543211',
      role: 'CLEANER',
    },
  })

  const staff2 = await prisma.staff.create({
    data: {
      companyId: company.id,
      name: 'Sita Sharma',
      email: 'sita@demo.com',
      phone: '+91-9876543212',
      role: 'SUPERVISOR',
    },
  })

  console.log('Created staff members')

  // Create toilets
  const toilets = []
  for (let floor of [groundFloor, firstFloor]) {
    for (let i = 1; i <= 3; i++) {
      const toilet = await prisma.toilet.create({
        data: {
          floorId: floor.id,
          toiletNumber: `T-${floor.floorNumber}${i.toString().padStart(2, '0')}`,
          qrCode: `QR-${floor.floorNumber}${i.toString().padStart(2, '0')}`,
          cleaningFrequency: 2,
          lastCleanedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          nextCleaningDue: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        },
      })
      toilets.push(toilet)

      // Assign staff to toilets
      await prisma.staffAssignment.create({
        data: {
          staffId: staff1.id,
          toiletId: toilet.id,
        },
      })
    }
  }

  console.log('Created toilets and assignments')

  // Create sample feedback
  const sampleFeedback = [
    { rating: 5, issueType: null, comment: 'Very clean and well maintained!' },
    { rating: 4, issueType: null, comment: 'Good condition, could be better' },
    { rating: 2, issueType: 'NO_SOAP', comment: 'No soap in the dispenser' },
    { rating: 3, issueType: 'WET_FLOOR', comment: 'Floor was wet, need to put up a sign' },
    { rating: 1, issueType: 'DIRTY_FLOOR', comment: 'Very dirty, needs immediate attention' },
  ]

  for (let i = 0; i < sampleFeedback.length && i < toilets.length; i++) {
    await prisma.feedback.create({
      data: {
        toiletId: toilets[i].id,
        rating: sampleFeedback[i].rating,
        issueType: sampleFeedback[i].issueType,
        comment: sampleFeedback[i].comment,
        userAgent: 'Mozilla/5.0 (Demo Browser)',
        ipAddress: '192.168.1.100',
      },
    })
  }

  console.log('Created sample feedback')

  // Create cleaning logs
  for (let i = 0; i < 3; i++) {
    await prisma.cleaningLog.create({
      data: {
        toiletId: toilets[i].id,
        staffId: staff1.id,
        checklist: JSON.stringify(['FLOOR_CLEANED', 'SEAT_SANITIZED', 'TRASH_CLEARED']),
        notes: 'Regular cleaning completed',
        cleanedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    })
  }

  console.log('Created cleaning logs')

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })