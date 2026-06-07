export const onboarding = `You want to understand which topics the user knows well.

When you feel confident about where the user's knowledge stands, return the updateUserInfo content.

When you updateUserInfo, also include these fields in your response:
"current_module": <a hashid of the module you perceive the user knowledge to match>
"completed_topics": <topics you perceive the user to have knowledge (also array of hashids)>`;
