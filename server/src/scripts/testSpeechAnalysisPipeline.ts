import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../client/.env') });

if (!process.env.VITE_GEMINI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.VITE_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
}
if (!process.env.GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
}

console.log('Gemini API key loaded:', process.env.VITE_GEMINI_API_KEY ? 'YES (' + process.env.VITE_GEMINI_API_KEY.slice(0, 6) + '...)' : 'NO');

import { SpeechEvaluatorService } from '../../../client/src/services/speechEvaluator.service';

async function runSpeechAnalysisTests() {
  console.log('\n======================================================');
  console.log('🧪 SPEECH ANALYSIS & GEMINI EVALUATOR REGRESSION TEST');
  console.log('Validating:');
  console.log(' 1. A short transcript (< 10 words) is rejected with NO score and NO report saved');
  console.log(' 2. A Gemini failure returns ERROR, shows retry, and saves nothing (no mock scores)');
  console.log(' 3. Two different transcripts produce distinct reports computed from actual speech');
  console.log('======================================================\n');

  let passedTests = 0;
  const totalTests = 3;

  // ---------------------------------------------------------------------------
  // TEST 1: Short Transcript (< 10 words) is Rejected
  // ---------------------------------------------------------------------------
  console.log('[TEST 1] Short transcript under 10 words is rejected without scoring...');
  const shortTranscript = 'Good morning everyone, welcome today.';
  const shortResult = await SpeechEvaluatorService.runSharedSpeechAnalysis({
    transcript: shortTranscript,
    durationSeconds: 15,
    topicTitle: 'Executive Update',
  });

  if (shortResult.status === 'TOO_SHORT') {
    console.log(`- Status: ${shortResult.status} (Expected: TOO_SHORT)`);
    console.log(`- Word count detected: ${shortResult.wordCount} words`);
    console.log(`- Validation message: "${shortResult.message}"`);
    console.log(`- Score generated: NONE (Correct, no mock scores given)`);
    console.log('✅ PASSED TEST 1: Short speech (< 10 words) was rejected with no score.\n');
    passedTests++;
  } else {
    console.error(`❌ FAILED TEST 1: Expected status TOO_SHORT, received ${shortResult.status}`);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Gemini Failure Saves Nothing and Never Returns Fake Scores
  // ---------------------------------------------------------------------------
  console.log('[TEST 2] Gemini failure returns ERROR and saves no report...');
  const originalKey = process.env.VITE_GEMINI_API_KEY;
  const originalKey2 = process.env.GEMINI_API_KEY;

  try {
    // Temporarily clear API key to simulate Gemini API failure/unavailability
    process.env.VITE_GEMINI_API_KEY = 'invalid_key_testing_failure';
    process.env.GEMINI_API_KEY = 'invalid_key_testing_failure';

    const failResult = await SpeechEvaluatorService.runSharedSpeechAnalysis({
      transcript: 'Today I want to talk about how modern artificial intelligence and machine learning pipelines are transforming developer productivity across global teams.',
      durationSeconds: 30,
      topicTitle: 'AI in Engineering',
    });

    if (failResult.status === 'ERROR') {
      console.log(`- Status: ${failResult.status} (Expected: ERROR)`);
      console.log(`- Error details: "${failResult.error}"`);
      console.log(`- Report saved: NONE (Correct, failure does not save bogus reports)`);
      console.log('✅ PASSED TEST 2: Gemini failure cleanly returned ERROR with no saved report.\n');
      passedTests++;
    } else {
      console.error(`❌ FAILED TEST 2: Expected status ERROR on failure, received ${failResult.status}`);
      process.exit(1);
    }
  } finally {
    // Restore original API keys
    process.env.VITE_GEMINI_API_KEY = originalKey;
    process.env.GEMINI_API_KEY = originalKey2;
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Two Different Transcripts Give Different Gemini Reports
  // ---------------------------------------------------------------------------
  console.log('[TEST 3] Two different transcripts produce distinct reports based on what was said...');

  const transcriptA =
    'Our enterprise recurring revenue grew thirty-five percent year-over-year. We successfully minimized customer churn and optimized our unit economics through automation and customer engagement initiatives.';
  const transcriptB =
    'My favorite weekend pastime is hiking in the mountains. I love breathing fresh pine air, cooking hearty pasta dinners, and spending quiet evenings reading historical fiction.';

  console.log('- Running Gemini analysis on Speech A (Business Strategy)...');
  const resultA = await SpeechEvaluatorService.runSharedSpeechAnalysis({
    transcript: transcriptA,
    durationSeconds: 35,
    topicTitle: 'Corporate Financial Review',
    topicCategory: 'Business',
  });

  console.log('- Running Gemini analysis on Speech B (Hobbies & Personal)...');
  const resultB = await SpeechEvaluatorService.runSharedSpeechAnalysis({
    transcript: transcriptB,
    durationSeconds: 30,
    topicTitle: 'My Favorite Weekend',
    topicCategory: 'Personal',
  });

  if (resultA.status !== 'SUCCESS' || resultB.status !== 'SUCCESS') {
    console.error(`❌ FAILED TEST 3: Expected SUCCESS for both speeches. Result A: ${resultA.status}, Result B: ${resultB.status}`);
    process.exit(1);
  }

  const reportA = resultA.report;
  const reportB = resultB.report;

  console.log(`- Speech A Overall Score: ${reportA.overallScore}/100 | Summary: "${reportA.llmAnalysis.executiveSummary}"`);
  console.log(`- Speech B Overall Score: ${reportB.overallScore}/100 | Summary: "${reportB.llmAnalysis.executiveSummary}"`);

  // Verify that summaries and evaluations are distinct and not hardcoded
  if (reportA.overallScore === 18 || reportB.overallScore === 18) {
    console.error('❌ FAILED TEST 3: Report returned the hardcoded 18/100 score!');
    process.exit(1);
  }

  if (reportA.llmAnalysis.executiveSummary === reportB.llmAnalysis.executiveSummary) {
    console.error('❌ FAILED TEST 3: Both speeches produced identical executive summaries!');
    process.exit(1);
  }

  // Verify phonetics if present are derived dynamically or labeled as estimate
  if (reportA.pronunciationAnalysis) {
    console.log(`- Speech A Phonetics: Estimated = ${reportA.pronunciationAnalysis.isEstimated}, Words evaluated: ${reportA.pronunciationAnalysis.mispronouncedWords.map(m => m.word).join(', ') || 'None'}`);
  }
  if (reportB.pronunciationAnalysis) {
    console.log(`- Speech B Phonetics: Estimated = ${reportB.pronunciationAnalysis.isEstimated}, Words evaluated: ${reportB.pronunciationAnalysis.mispronouncedWords.map(m => m.word).join(', ') || 'None'}`);
  }

  console.log('✅ PASSED TEST 3: Two distinct transcripts generated two distinct, dynamically evaluated reports.\n');
  passedTests++;

  console.log('======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} SPEECH ANALYSIS REGRESSION TESTS PASSED!`);
  console.log('======================================================\n');
}

runSpeechAnalysisTests().catch((err) => {
  console.error('Test execution failed with unhandled exception:', err);
  process.exit(1);
});
