#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function testVisual() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Check for errors in console
    let consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a moment for any scripts to run
    await page.waitForTimeout(2000);

    // Check if key elements are present
    const recordButton = await page.$('button');  // Just check for any button
    const allText = await page.evaluate(() => document.body.innerText);
    const hasEmotiArt = allText.includes('EmotiArt');
    const hasRecordSession = allText.includes('Record Session');
    const hasStartRecording = allText.includes('Start Recording');

    console.log('\n═══════════════════════════════════════════');
    console.log('🎨 Visual Test Results');
    console.log('═══════════════════════════════════════════\n');

    if (hasEmotiArt) {
      console.log('✓ EmotiArt title found');
    } else {
      console.log('✗ EmotiArt title NOT found');
    }

    if (hasRecordSession) {
      console.log('✓ Recording panel found');
    } else {
      console.log('✗ Recording panel NOT found');
    }

    if (hasStartRecording) {
      console.log('✓ Start Recording button found');
    } else {
      console.log('✗ Start Recording button NOT found');
    }

    if (consoleErrors.length === 0) {
      console.log('✓ No console errors');
    } else {
      console.log(`✗ ${consoleErrors.length} console errors:`);
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n═══════════════════════════════════════════\n');

    // Take screenshot
    await page.screenshot({ path: '/Users/mateososaalbrecht/BluHacks26/temporary screenshots/test-visual.png' });
    console.log('Screenshot saved to: temporary screenshots/test-visual.png\n');

    process.exit(consoleErrors.length === 0 ? 0 : 1);
  } finally {
    await browser.close();
  }
}

testVisual().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
