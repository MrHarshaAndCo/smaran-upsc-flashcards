/**
 * Quiz Engine for UPSC Prelims Mock Simulator, Hesitation Analytics, and Weakness Queue.
 */

export interface QuestionResult {
	questionId: string;
	chosen: number | null; // null if skipped
	correct: boolean;
	ms: number; // time spent in ms
}

export interface PrelimsScorecard {
	totalQuestions: number;
	attempted: number;
	correct: number;
	incorrect: number;
	unattempted: number;
	rawScore: number;       // +2 per correct, -0.666 per incorrect
	scaledScore200: number; // scaled score out of 200 marks (UPSC CSAT GS paper 1 standard)
	accuracyPct: number;
	cutoffVerdict: {
		passed: boolean;
		label: string;
		detail: string;
		tone: 'green' | 'amber' | 'red';
	};
	timeTakenSec: number;
	avgTimePerQuestionSec: number;
	hesitantCount: number;
	quickRecallCount: number;
}

/**
 * Calculate official UPSC Prelims style score with negative marking.
 */
export function calculatePrelimsScore(
	results: QuestionResult[],
	totalQuestionsCount: number,
	startedAt: number,
	endedAt: number = Date.now()
): PrelimsScorecard {
	const attemptedResults = results.filter((r) => r.chosen !== null);
	const attempted = attemptedResults.length;
	const correct = results.filter((r) => r.correct).length;
	const incorrect = attempted - correct;
	const unattempted = Math.max(0, totalQuestionsCount - attempted);

	// Official UPSC Marking: +2 for correct, -0.666 (1/3 penalty) for wrong
	const marksPerCorrect = 2.0;
	const penaltyPerWrong = 0.666;

	const rawScore = correct * marksPerCorrect - incorrect * penaltyPerWrong;
	// Scale to 200 marks standard GS Paper 1
	const multiplier = totalQuestionsCount > 0 ? 100 / totalQuestionsCount : 1;
	const scaledScore200 = Math.round(Math.max(0, rawScore * multiplier) * 10) / 10;
	const accuracyPct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

	// Prelims Cutoff benchmark (~88-92 marks out of 200)
	let cutoffVerdict: PrelimsScorecard['cutoffVerdict'];
	if (scaledScore200 >= 95) {
		cutoffVerdict = {
			passed: true,
			label: 'Comfortably Clearing Cutoff',
			detail: 'Outstanding score! You are comfortably above the estimated General Category Prelims cutoff (88-92 marks).',
			tone: 'green'
		};
	} else if (scaledScore200 >= 85) {
		cutoffVerdict = {
			passed: true,
			label: 'Borderline Cutoff Zone',
			detail: 'Good effort! You are right around the Prelims cutoff zone (85-92 marks). Focus on accuracy to secure your seat.',
			tone: 'amber'
		};
	} else {
		cutoffVerdict = {
			passed: false,
			label: 'Below Cutoff Threshold',
			detail: 'Below estimated Prelims cutoff (88 marks). High negative marking impact — review your incorrect picks.',
			tone: 'red'
		};
	}

	const timeTakenSec = Math.round((endedAt - startedAt) / 1000);
	const avgTimePerQuestionSec = attempted > 0 ? Math.round(timeTakenSec / attempted) : 0;

	let hesitantCount = 0;
	let quickRecallCount = 0;
	for (const r of results) {
		const sec = r.ms / 1000;
		if (sec > 45) hesitantCount++;
		else if (sec < 10) quickRecallCount++;
	}

	return {
		totalQuestions: totalQuestionsCount,
		attempted,
		correct,
		incorrect,
		unattempted,
		rawScore: Math.round(rawScore * 100) / 100,
		scaledScore200,
		accuracyPct,
		cutoffVerdict,
		timeTakenSec,
		avgTimePerQuestionSec,
		hesitantCount,
		quickRecallCount
	};
}

/**
 * Filter questions for Weakness Revision Queue based on past misses.
 */
export function getWeaknessQueue<T extends { id: string }>(
	questions: T[],
	missedQuestionIds: Set<string> | string[]
): T[] {
	const set = missedQuestionIds instanceof Set ? missedQuestionIds : new Set(missedQuestionIds);
	return questions.filter((q) => set.has(q.id));
}
