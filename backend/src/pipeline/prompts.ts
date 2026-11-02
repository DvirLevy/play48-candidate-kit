/** Prompt for the image-edit API: apply the user's edit and keep everything else. */
export function buildImagePrompt(userPrompt: string): string {
  return [
    userPrompt.trim(),
    'Apply only the visual change described above to the character.',
    'Keep the same character, art style, proportions, pose, framing and plain background.',
    'Full body of the character must remain fully visible.',
  ].join('\n');
}

/** Prompt for the video API: animate the edited still as a seamless loop. */
export function buildVideoPrompt(userPrompt: string): string {
  return [
    userPrompt.trim(),
    'Animate the character in a seamless loop, in place, with a static camera and the same plain background.',
    'Keep the character design and colors identical to the first frame throughout the clip.',
  ].join(' ');
}
