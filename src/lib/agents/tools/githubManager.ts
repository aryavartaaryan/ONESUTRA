import type {
    GitHubManagerRequest,
    GitHubManagerResult,
    ToolExecutionContext,
} from '@/lib/agents/types';
import type { Firestore } from 'firebase-admin/firestore';

type GitHubPull = {
    number: number;
    title: string;
    html_url: string;
    user?: { login?: string };
};

export async function githubManagerTool(
    db: Firestore,
    args: GitHubManagerRequest,
    _ctx: ToolExecutionContext
): Promise<GitHubManagerResult> {
    const profileSnap = await db.doc(`users/${args.userId}`).get();
    const codingStyle = (profileSnap.data()?.coding_style as string | undefined) ??
        'Prefer concise, test-backed, and readable changes.';

    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const perPage = Math.max(3, Math.min(args.maxPulls ?? 8, 20));
    const res = await fetch(
        `https://api.github.com/repos/${args.owner}/${args.repo}/pulls?state=open&per_page=${perPage}`,
        { headers }
    );

    if (!res.ok) {
        throw new Error(`GitHub API error (${res.status}) while fetching pull requests`);
    }

    const pulls = (await res.json()) as GitHubPull[];
    const openPullRequests = pulls.map((pr) => ({
        number: pr.number,
        title: pr.title,
        author: pr.user?.login ?? 'unknown',
        url: pr.html_url,
        suggestedReview: `Review with style lens: ${codingStyle}. Prioritize risk hotspots, test coverage, and naming clarity in this PR.`,
    }));

    return {
        openPullRequests,
        summary:
            openPullRequests.length > 0
                ? `${openPullRequests.length} open PRs found for ${args.owner}/${args.repo}. Review suggestions prepared.`
                : `No open PRs found for ${args.owner}/${args.repo}.`,
    };
}
