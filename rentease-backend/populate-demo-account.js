const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_EMAIL = 'mo@gmail.com';
const DEMO_PASSWORD = '123456';

async function populateDemoAccount() {
  console.log('🚀 Starting demo account population...\n');

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    // 1. Create or update the main user (as a TENANT)
    console.log('📝 Creating/Updating demo tenant account...');
    let demoUser = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {
        password: hashedPassword,
        points: 850, // Give them some points to start
      },
      create: {
        email: DEMO_EMAIL,
        username: 'mo_demo',
        password: hashedPassword,
        name: 'Mo Demo',
        role: 'tenant',
        points: 850,
      },
    });
    console.log(`✅ Demo tenant created: ${demoUser.name} (${demoUser.email})\n`);

    // 2. Create a landlord for the demo tenant
    console.log('🏠 Creating demo landlord...');
    const landlordPassword = await bcrypt.hash('landlord123', 10);
    let demoLandlord = await prisma.user.upsert({
      where: { email: 'landlord@demo.com' },
      update: {},
      create: {
        email: 'landlord@demo.com',
        username: 'demo_landlord',
        password: landlordPassword,
        name: 'Demo Landlord',
        role: 'landlord',
        points: 0,
      },
    });
    console.log(`✅ Demo landlord created: ${demoLandlord.name}\n`);

    // 3. Create properties for the landlord
    console.log('🏢 Creating properties...');
    const properties = await Promise.all([
      prisma.property.create({
        data: {
          landlordId: demoLandlord.id,
          name: 'Sunset Apartments',
          address: '123 Ocean Drive, Miami, FL 33139',
          units: 12,
          monthlyRent: 2500,
          description: 'Beautiful beachfront apartments with ocean views',
        },
      }),
      prisma.property.create({
        data: {
          landlordId: demoLandlord.id,
          name: 'Downtown Lofts',
          address: '456 Main Street, San Francisco, CA 94102',
          units: 8,
          monthlyRent: 3200,
          description: 'Modern lofts in the heart of downtown',
        },
      }),
      prisma.property.create({
        data: {
          landlordId: demoLandlord.id,
          name: 'Green Valley Homes',
          address: '789 Park Avenue, Seattle, WA 98101',
          units: 6,
          monthlyRent: 2800,
          description: 'Eco-friendly homes with garden access',
        },
      }),
    ]);
    console.log(`✅ Created ${properties.length} properties\n`);

    // Assign tenant to first property
    await prisma.user.update({
      where: { id: demoUser.id },
      data: {
        landlordId: demoLandlord.id,
        propertyId: properties[0].id,
      },
    });
    console.log(`✅ Assigned tenant to ${properties[0].name}\n`);

    // Refresh the user object
    demoUser = await prisma.user.findUnique({ where: { id: demoUser.id } });

    // 4. Create additional tenants for the landlord
    console.log('👥 Creating other tenants...');
    const otherTenants = await Promise.all([
      prisma.user.create({
        data: {
          email: 'alice@demo.com',
          username: 'alice_tenant',
          password: await bcrypt.hash('password123', 10),
          name: 'Alice Johnson',
          role: 'tenant',
          landlordId: demoLandlord.id,
          propertyId: properties[0].id,
          points: 450,
        },
      }),
      prisma.user.create({
        data: {
          email: 'bob@demo.com',
          username: 'bob_tenant',
          password: await bcrypt.hash('password123', 10),
          name: 'Bob Smith',
          role: 'tenant',
          landlordId: demoLandlord.id,
          propertyId: properties[1].id,
          points: 320,
        },
      }),
      prisma.user.create({
        data: {
          email: 'charlie@demo.com',
          username: 'charlie_tenant',
          password: await bcrypt.hash('password123', 10),
          name: 'Charlie Brown',
          role: 'tenant',
          landlordId: demoLandlord.id,
          propertyId: properties[2].id,
          points: 680,
        },
      }),
    ]);
    console.log(`✅ Created ${otherTenants.length} other tenants\n`);

    // 5. Create Bills (past and future)
    console.log('💰 Creating bills...');
    const now = new Date();
    const bills = [];

    // Past paid bills (3 months back)
    for (let i = 1; i <= 3; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(now.getMonth() - i);
      dueDate.setDate(1);
      
      const paidDate = new Date(dueDate);
      paidDate.setDate(dueDate.getDate() - 2); // Paid 2 days early

      bills.push(
        await prisma.bill.create({
          data: {
            tenantId: demoUser.id,
            landlordId: demoLandlord.id,
            type: 'Rent',
            amount: 2500,
            dueDate: dueDate,
            isPaid: true,
            paidDate: paidDate,
            description: `Monthly rent for ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          },
        })
      );

      // Add utility bills too
      bills.push(
        await prisma.bill.create({
          data: {
            tenantId: demoUser.id,
            landlordId: demoLandlord.id,
            type: 'Utilities',
            amount: 150 + Math.random() * 50,
            dueDate: new Date(dueDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            isPaid: true,
            paidDate: new Date(dueDate.getTime() + 3 * 24 * 60 * 60 * 1000),
            description: `Utilities for ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          },
        })
      );
    }

    // Current month bill (unpaid)
    const currentDueDate = new Date(now.getFullYear(), now.getMonth(), 1);
    bills.push(
      await prisma.bill.create({
        data: {
          tenantId: demoUser.id,
          landlordId: demoLandlord.id,
          type: 'Rent',
          amount: 2500,
          dueDate: currentDueDate,
          isPaid: false,
          description: `Monthly rent for ${currentDueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        },
      })
    );

    bills.push(
      await prisma.bill.create({
        data: {
          tenantId: demoUser.id,
          landlordId: demoLandlord.id,
          type: 'Utilities',
          amount: 175,
          dueDate: new Date(currentDueDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          isPaid: false,
          description: `Utilities for ${currentDueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        },
      })
    );

    // Next month bill
    const nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    bills.push(
      await prisma.bill.create({
        data: {
          tenantId: demoUser.id,
          landlordId: demoLandlord.id,
          type: 'Rent',
          amount: 2500,
          dueDate: nextDueDate,
          isPaid: false,
          description: `Monthly rent for ${nextDueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        },
      })
    );

    console.log(`✅ Created ${bills.length} bills\n`);

    // 6. Create Rewards for paid bills
    console.log('🎁 Creating rewards...');
    const paidBills = bills.filter(b => b.isPaid);
    const rewards = await Promise.all(
      paidBills.map(bill =>
        prisma.reward.create({
          data: {
            tenantId: demoUser.id,
            billId: bill.id,
            amount: bill.amount,
            date: bill.paidDate,
            isOnTime: true,
            pointsEarned: bill.type === 'Rent' ? 100 : 50,
          },
        })
      )
    );
    console.log(`✅ Created ${rewards.length} rewards\n`);

    // 7. Create Expenses (last 3 months)
    console.log('💸 Creating expenses...');
    const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];
    const expenses = [];

    for (let month = 0; month < 3; month++) {
      const monthDate = new Date(now);
      monthDate.setMonth(now.getMonth() - month);

      // 15-25 expenses per month
      const expenseCount = 15 + Math.floor(Math.random() * 10);
      for (let i = 0; i < expenseCount; i++) {
        const expenseDate = new Date(monthDate);
        expenseDate.setDate(Math.floor(Math.random() * 28) + 1);
        
        const category = categories[Math.floor(Math.random() * categories.length)];
        let amount;
        let description;

        switch (category) {
          case 'Food':
            amount = 10 + Math.random() * 90;
            description = ['Grocery shopping', 'Restaurant dinner', 'Coffee shop', 'Fast food', 'Meal delivery'][Math.floor(Math.random() * 5)];
            break;
          case 'Transportation':
            amount = 5 + Math.random() * 45;
            description = ['Gas', 'Uber ride', 'Public transit', 'Parking', 'Car maintenance'][Math.floor(Math.random() * 5)];
            break;
          case 'Entertainment':
            amount = 15 + Math.random() * 85;
            description = ['Movie tickets', 'Concert', 'Streaming service', 'Video games', 'Sports event'][Math.floor(Math.random() * 5)];
            break;
          case 'Shopping':
            amount = 20 + Math.random() * 180;
            description = ['Clothing', 'Electronics', 'Home goods', 'Books', 'Gifts'][Math.floor(Math.random() * 5)];
            break;
          case 'Healthcare':
            amount = 30 + Math.random() * 170;
            description = ['Pharmacy', 'Doctor visit', 'Gym membership', 'Dental', 'Health insurance'][Math.floor(Math.random() * 5)];
            break;
          default:
            amount = 10 + Math.random() * 90;
            description = ['Miscellaneous', 'Personal care', 'Pet supplies', 'Education', 'Donation'][Math.floor(Math.random() * 5)];
        }

        expenses.push(
          await prisma.expense.create({
            data: {
              tenantId: demoUser.id,
              category: category,
              amount: Math.round(amount * 100) / 100,
              date: expenseDate,
              description: description,
            },
          })
        );
      }
    }
    console.log(`✅ Created ${expenses.length} expenses\n`);

    // 8. Create Budgets with categories
    console.log('📊 Creating budgets...');
    
    // Weekly budget
    const weeklyBudget = await prisma.budget.create({
      data: {
        tenantId: demoUser.id,
        period: 'week',
        amount: 500,
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
        daysCompleted: 8,
        lastCheckedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        pointsAwarded: false,
      },
    });

    await Promise.all([
      prisma.categoryBudget.create({
        data: { budgetId: weeklyBudget.id, category: 'Food', percentage: 40, amount: 200 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: weeklyBudget.id, category: 'Transportation', percentage: 20, amount: 100 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: weeklyBudget.id, category: 'Entertainment', percentage: 15, amount: 75 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: weeklyBudget.id, category: 'Shopping', percentage: 15, amount: 75 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: weeklyBudget.id, category: 'Other', percentage: 10, amount: 50 },
      }),
    ]);

    // Monthly budget
    const monthlyBudget = await prisma.budget.create({
      data: {
        tenantId: demoUser.id,
        period: 'month',
        amount: 2000,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        daysCompleted: 15,
        lastCheckedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        pointsAwarded: false,
      },
    });

    await Promise.all([
      prisma.categoryBudget.create({
        data: { budgetId: monthlyBudget.id, category: 'Food', percentage: 35, amount: 700 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: monthlyBudget.id, category: 'Transportation', percentage: 20, amount: 400 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: monthlyBudget.id, category: 'Entertainment', percentage: 15, amount: 300 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: monthlyBudget.id, category: 'Shopping', percentage: 15, amount: 300 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: monthlyBudget.id, category: 'Healthcare', percentage: 10, amount: 200 },
      }),
      prisma.categoryBudget.create({
        data: { budgetId: monthlyBudget.id, category: 'Other', percentage: 5, amount: 100 },
      }),
    ]);

    console.log(`✅ Created budgets with categories\n`);

    // 9. Create Rent Plans
    console.log('📄 Creating rent plans...');
    
    // Active rent plan
    const activeRentPlan = await prisma.rentPlan.create({
      data: {
        tenantId: demoUser.id,
        landlordId: demoLandlord.id,
        propertyId: properties[0].id,
        monthlyRent: 2500,
        deposit: 5000,
        duration: 12,
        description: 'One-year lease for Sunset Apartments Unit 3B',
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        nextDueDate: currentDueDate,
        status: 'accepted',
        proposedDate: new Date(now.getFullYear(), now.getMonth() - 3, 15),
        reviewedDate: new Date(now.getFullYear(), now.getMonth() - 3, 18),
        acceptedAt: new Date(now.getFullYear(), now.getMonth() - 3, 20),
        docusealStatus: 'signed',
        docusealSignedAt: new Date(now.getFullYear(), now.getMonth() - 3, 20),
      },
    });

    // Pending rent plan (renewal offer)
    const pendingRentPlan = await prisma.rentPlan.create({
      data: {
        tenantId: demoUser.id,
        landlordId: demoLandlord.id,
        propertyId: properties[0].id,
        monthlyRent: 2600,
        deposit: 0, // No new deposit for renewal
        duration: 12,
        description: 'Lease renewal with slight rent increase',
        status: 'pending',
        proposedDate: new Date(),
      },
    });

    // Completed rent plan (previous lease)
    const completedRentPlan = await prisma.rentPlan.create({
      data: {
        tenantId: demoUser.id,
        landlordId: demoLandlord.id,
        propertyId: properties[0].id,
        monthlyRent: 2400,
        deposit: 5000,
        duration: 12,
        description: 'Initial one-year lease',
        startDate: new Date(now.getFullYear() - 1, now.getMonth() - 2, 1),
        status: 'completed',
        proposedDate: new Date(now.getFullYear() - 1, now.getMonth() - 3, 10),
        reviewedDate: new Date(now.getFullYear() - 1, now.getMonth() - 3, 12),
        acceptedAt: new Date(now.getFullYear() - 1, now.getMonth() - 3, 15),
        completedDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        docusealStatus: 'signed',
      },
    });

    console.log(`✅ Created 3 rent plans\n`);

    // 10. Create Shop Items (global)
    console.log('🛍️ Creating shop items...');
    let shopItems = await prisma.shopItem.findMany();
    
    if (shopItems.length === 0) {
      shopItems = await Promise.all([
        prisma.shopItem.create({
          data: {
            name: '$10 Amazon Gift Card',
            description: 'Redeem your points for a $10 Amazon gift card',
            pointCost: 500,
            imageUrl: '/shop/amazon-gift-card.jpg',
          },
        }),
        prisma.shopItem.create({
          data: {
            name: '$25 Restaurant Voucher',
            description: 'Enjoy a meal at participating restaurants',
            pointCost: 1000,
            imageUrl: '/shop/restaurant-voucher.jpg',
          },
        }),
        prisma.shopItem.create({
          data: {
            name: 'Movie Tickets (2)',
            description: 'Two movie tickets for a theater of your choice',
            pointCost: 750,
            imageUrl: '/shop/movie-tickets.jpg',
          },
        }),
        prisma.shopItem.create({
          data: {
            name: '$50 Rent Discount',
            description: '$50 discount on your next rent payment',
            pointCost: 2000,
            imageUrl: '/shop/rent-discount.jpg',
          },
        }),
        prisma.shopItem.create({
          data: {
            name: 'Gym Membership (1 Month)',
            description: 'One month free gym membership',
            pointCost: 1500,
            imageUrl: '/shop/gym-membership.jpg',
          },
        }),
        prisma.shopItem.create({
          data: {
            name: 'Coffee Shop Gift Card',
            description: '$15 gift card for local coffee shops',
            pointCost: 600,
            imageUrl: '/shop/coffee-card.jpg',
          },
        }),
        prisma.shopItem.create({
          data: {
            name: 'Streaming Service (3 Months)',
            description: 'Three months of premium streaming service',
            pointCost: 1200,
            imageUrl: '/shop/streaming.jpg',
          },
        }),
        prisma.shopItem.create({
          data: {
            name: '$100 Electronics Voucher',
            description: 'Use at major electronics retailers',
            pointCost: 4000,
            imageUrl: '/shop/electronics-voucher.jpg',
          },
        }),
      ]);
      console.log(`✅ Created ${shopItems.length} shop items\n`);
    } else {
      console.log(`✅ Using existing ${shopItems.length} shop items\n`);
    }

    // 11. Create Redemptions
    console.log('🎫 Creating redemptions...');
    const redemptions = await Promise.all([
      prisma.redemption.create({
        data: {
          tenantId: demoUser.id,
          itemId: shopItems[0].id,
          itemName: shopItems[0].name,
          pointsSpent: shopItems[0].pointCost,
          date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.redemption.create({
        data: {
          tenantId: demoUser.id,
          itemId: shopItems[5].id,
          itemName: shopItems[5].name,
          pointsSpent: shopItems[5].pointCost,
          date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.redemption.create({
        data: {
          tenantId: demoUser.id,
          itemId: shopItems[2].id,
          itemName: shopItems[2].name,
          pointsSpent: shopItems[2].pointCost,
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);
    console.log(`✅ Created ${redemptions.length} redemptions\n`);

    // 12. Create AI Conversations
    console.log('💬 Creating AI conversations...');
    const conversation1 = await prisma.conversation.create({
      data: {
        userId: demoUser.id,
        title: 'Budget Planning Help',
        messages: {
          create: [
            {
              role: 'user',
              content: 'Can you help me create a budget for this month?',
            },
            {
              role: 'assistant',
              content: "Of course! I'd be happy to help you create a monthly budget. Based on your expense history, I can see you typically spend around $2,000-2,500 per month. Let me break down some recommendations:\n\n1. **Food**: 35% (~$700) - This covers groceries and dining out\n2. **Transportation**: 20% (~$400) - Gas, public transit, rideshares\n3. **Entertainment**: 15% (~$300) - Movies, streaming, events\n4. **Shopping**: 15% (~$300) - Clothing, personal items\n5. **Healthcare**: 10% (~$200) - Medical expenses, gym\n6. **Other**: 5% (~$100) - Miscellaneous expenses\n\nWould you like to adjust any of these categories?",
            },
            {
              role: 'user',
              content: 'That looks good! How can I save more money on food?',
            },
            {
              role: 'assistant',
              content: "Great question! Here are some effective strategies to save money on food:\n\n1. **Meal Planning**: Plan your meals for the week before shopping to avoid impulse purchases\n2. **Cook at Home**: Restaurant meals can be 3-4x more expensive than home-cooked meals\n3. **Buy in Bulk**: For non-perishables and items you use frequently\n4. **Use Coupons & Apps**: Apps like Ibotta, Rakuten, and store loyalty programs\n5. **Reduce Food Waste**: Store food properly and use leftovers creatively\n6. **Shop Seasonal Produce**: It's fresher and cheaper\n7. **Limit Takeout**: Try to cook 5-6 days a week\n\nIf you implement these strategies, you could potentially save $100-200 per month on food expenses!",
            },
          ],
        },
      },
    });

    const conversation2 = await prisma.conversation.create({
      data: {
        userId: demoUser.id,
        title: 'Rent Payment Questions',
        messages: {
          create: [
            {
              role: 'user',
              content: 'When is my rent due this month?',
            },
            {
              role: 'assistant',
              content: `Based on your current rent plan, your rent is due on ${currentDueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. The amount is $2,500.\n\nYou also have a utilities bill of $175 due on ${new Date(currentDueDate.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.\n\nRemember, paying on time will earn you reward points! 🎉`,
            },
            {
              role: 'user',
              content: 'How many points will I get for paying on time?',
            },
            {
              role: 'assistant',
              content: "When you pay your bills on time, you'll earn:\n\n- **Rent Payment**: 100 points\n- **Utilities Payment**: 50 points\n\nSo if you pay both bills on time this month, you'll earn **150 points** total!\n\nYou currently have 850 points. You can redeem points in the Shop for various rewards like gift cards, vouchers, and even rent discounts. Keep up the great payment history! 🌟",
            },
          ],
        },
      },
    });

    const conversation3 = await prisma.conversation.create({
      data: {
        userId: demoUser.id,
        title: 'Expense Analysis',
        messages: {
          create: [
            {
              role: 'user',
              content: 'Can you analyze my spending patterns?',
            },
            {
              role: 'assistant',
              content: `I've analyzed your expenses over the past 3 months. Here's what I found:\n\n📊 **Spending Breakdown:**\n- Food: $658/month average (33%)\n- Transportation: $412/month average (21%)\n- Entertainment: $298/month average (15%)\n- Shopping: $342/month average (17%)\n- Healthcare: $156/month average (8%)\n- Other: $124/month average (6%)\n\n**Total Average: $1,990/month**\n\n✅ **Good News:**\n- You're staying within your budget most days!\n- Your food spending is reasonable\n- Healthcare costs are well-managed\n\n⚠️ **Areas to Watch:**\n- Shopping expenses are slightly high - consider if all purchases are necessary\n- Entertainment spending could be reduced by 20-30% if you're looking to save more\n\n💡 **Recommendation:** You're doing great overall! If you want to increase savings, I'd suggest cutting back on shopping and entertainment by about $100/month combined.`,
            },
          ],
        },
      },
    });

    console.log(`✅ Created 3 AI conversations with messages\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Demo Account Population Complete!\n');
    console.log('📧 Email: mo@gmail.com');
    console.log('🔑 Password: 123456');
    console.log('👤 Role: Tenant');
    console.log(`⭐ Points: ${demoUser.points}`);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 Summary of Created Data:');
    console.log(`   - Properties: ${properties.length}`);
    console.log(`   - Other Tenants: ${otherTenants.length}`);
    console.log(`   - Bills: ${bills.length}`);
    console.log(`   - Expenses: ${expenses.length}`);
    console.log(`   - Rewards: ${rewards.length}`);
    console.log(`   - Budgets: 2 (weekly + monthly)`);
    console.log(`   - Rent Plans: 3 (completed, active, pending)`);
    console.log(`   - Shop Items: ${shopItems.length}`);
    console.log(`   - Redemptions: ${redemptions.length}`);
    console.log(`   - AI Conversations: 3`);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✨ You can now login and explore all features!');
    console.log('💡 Tip: The account has unpaid bills you can test payment with.');

  } catch (error) {
    console.error('❌ Error populating demo account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateDemoAccount()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

