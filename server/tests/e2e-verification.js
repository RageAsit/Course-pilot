const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const Assignment = require('../src/models/assignment.model');
const StudyPlan = require('../src/models/studyPlan.model');

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log(' CoursePilot Phase 3: Live End-to-End Verification ');
  console.log('====================================================\n');

  await connectDB();

  const testEmail = `phase3_student_${Date.now()}@test.edu`;
  const password = 'Password@123';
  let authCookie = null;
  let testUserId = null;

  try {
    // 1. Register a student
    console.log(`[Step 1] Registering student (${testEmail})...`);
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Phase 3 Verification Student',
        email: testEmail,
        password,
      });

    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    }

    testUserId = regRes.body.user.id;
    const cookies = regRes.headers['set-cookie'];
    authCookie = Array.isArray(cookies) ? cookies.find((c) => c.startsWith('token=')) : cookies;
    console.log(`✓ Student registered successfully. User ID: ${testUserId}`);

    // 2. Create assignments: one overdue, one urgent high-importance, one normal, one completed
    console.log('\n[Step 2] Creating realistic coursework assignments in MongoDB...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const inFourDays = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    // Overdue assignment
    const a1 = await request(app)
      .post('/api/assignments')
      .set('Cookie', authCookie)
      .send({
        title: 'Software Eng Milestone 2',
        subject: 'CS450',
        dueDate: yesterday.toISOString(),
        estimatedMinutes: 90,
        remainingMinutes: 90,
        importance: 4,
      });
    console.log(`✓ Created Overdue Assignment: "${a1.body.assignment.title}" (90m, Importance 4)`);

    // Urgent high importance
    const a2 = await request(app)
      .post('/api/assignments')
      .set('Cookie', authCookie)
      .send({
        title: 'Machine Learning Term Paper',
        subject: 'CS580',
        dueDate: inTwoDays.toISOString(),
        estimatedMinutes: 180,
        remainingMinutes: 180,
        importance: 5,
      });
    console.log(`✓ Created Urgent Assignment: "${a2.body.assignment.title}" (180m, Importance 5)`);

    // Normal assignment
    const a3 = await request(app)
      .post('/api/assignments')
      .set('Cookie', authCookie)
      .send({
        title: 'Cloud Computing Lab 4',
        subject: 'CS460',
        dueDate: inFourDays.toISOString(),
        estimatedMinutes: 120,
        remainingMinutes: 120,
        importance: 3,
      });
    console.log(`✓ Created Normal Assignment: "${a3.body.assignment.title}" (120m, Importance 3)`);

    // Completed assignment (should be excluded from priority queue and study plan)
    const a4 = await request(app)
      .post('/api/assignments')
      .set('Cookie', authCookie)
      .send({
        title: 'Research Ethics Quiz',
        subject: 'ETH101',
        dueDate: inTwoDays.toISOString(),
        estimatedMinutes: 45,
        remainingMinutes: 0,
        importance: 2,
      });
    // Mark as completed
    await request(app)
      .patch(`/api/assignments/${a4.body.assignment.id}/complete`)
      .set('Cookie', authCookie);
    console.log(`✓ Created and Completed Assignment: "Research Ethics Quiz" (Should be excluded)`);

    // 3. Test Priority Engine endpoint
    console.log('\n[Step 3] Querying Priority Engine (GET /api/planner/priorities)...');
    const priRes = await request(app)
      .get('/api/planner/priorities')
      .set('Cookie', authCookie);

    if (priRes.status !== 200 || !priRes.body.success) {
      throw new Error(`Priority engine failed: ${JSON.stringify(priRes.body)}`);
    }

    console.log(`✓ Returned ${priRes.body.count} active prioritized assignments:`);
    priRes.body.assignments.forEach((p, idx) => {
      console.log(`   Rank #${idx + 1} | Score: ${p.priorityScore}/100 | ${p.subject}: "${p.title}"`);
      console.log(`      Driver: ${p.priorityExplanation.summary}`);
      console.log(`      Factors: Urgency=${p.priorityExplanation.urgencyScore}/40, Importance=${p.priorityExplanation.importanceScore}/30, Effort=${p.priorityExplanation.effortScore}/20, OverdueBonus=${p.priorityExplanation.overdueBonus}/10`);
    });

    // Verify completed assignment was excluded
    const hasCompleted = priRes.body.assignments.some((p) => p.title === 'Research Ethics Quiz');
    if (hasCompleted) {
      throw new Error('Completed assignment appeared in priority queue!');
    }
    console.log('✓ Verified: Completed assignments are strictly excluded from priority rankings.');

    // 4. Test Automatic Study Planner endpoint
    console.log('\n[Step 4] Generating Automatic Study Schedule (POST /api/planner/generate)...');
    const todayStr = now.toISOString().split('T')[0];
    const planRes = await request(app)
      .post('/api/planner/generate')
      .set('Cookie', authCookie)
      .send({
        startDate: todayStr,
        horizonDays: 7,
        dailyCapacityMinutes: 120, // 2 hours/day
        preferredSessionMinutes: 60, // 1 hour blocks
      });

    if (planRes.status !== 201 || !planRes.body.success) {
      throw new Error(`Study planner failed: ${JSON.stringify(planRes.body)}`);
    }

    const plan = planRes.body.plan;
    console.log(`✓ Study Plan generated! Plan ID: ${plan.id}`);
    console.log(`   Total Study Minutes Scheduled: ${plan.totalStudyMinutesScheduled} mins`);
    console.log(`   Total Sessions Scheduled: ${plan.sessions.length}`);
    console.log(`   Warnings: ${plan.warnings.length}`);
    if (plan.warnings.length > 0) {
      plan.warnings.forEach((w) => console.log(`      - ${w}`));
    }
    console.log(`   Unscheduled Tasks: ${plan.unscheduled.length}`);

    console.log('\n   Day-by-Day Schedule Breakdown:');
    plan.days.forEach((day) => {
      console.log(`   📅 Date: ${day.dateString} (${day.usedMinutes}m / ${day.capacityMinutes}m capacity, ${day.sessions.length} sessions)`);
      day.sessions.forEach((s) => {
        console.log(`      • [${s.durationMinutes}m] ${s.subject}: ${s.title}`);
      });
    });

    // 5. Test Current Plan Retrieval endpoint
    console.log('\n[Step 5] Retrieving Persisted Study Plan (GET /api/planner/current)...');
    const currentRes = await request(app)
      .get('/api/planner/current')
      .set('Cookie', authCookie);

    if (currentRes.status !== 200 || !currentRes.body.plan) {
      throw new Error(`Failed to retrieve persisted plan: ${JSON.stringify(currentRes.body)}`);
    }

    if (currentRes.body.plan.id !== plan.id) {
      throw new Error('Persisted plan ID mismatch!');
    }
    console.log(`✓ Successfully retrieved persisted plan ${currentRes.body.plan.id} from MongoDB Atlas.`);

    console.log('\n====================================================');
    console.log(' ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY!  ');
    console.log('====================================================\n');
  } finally {
    // Clean up created test data
    if (testUserId) {
      console.log('[Cleanup] Cleaning up test user and artifacts...');
      await Assignment.deleteMany({ user: testUserId });
      await StudyPlan.deleteMany({ user: testUserId });
      await User.findByIdAndDelete(testUserId);
      console.log('✓ Cleanup complete.');
    }
    await disconnectDB();
  }
}

runEndToEndVerification().catch((err) => {
  console.error('\n❌ End-to-end verification error:', err);
  process.exit(1);
});
