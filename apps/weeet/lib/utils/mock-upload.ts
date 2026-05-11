// D76 defer Phase D — mock upload using Lorem Picsum + placeholder video
// Phase D: swap mock URL → real S3/R2 URL without changing UI components

export function mockUploadImage(file: File): Promise<{ id: string; url: string }> {
  void file; // Phase D: replace with real upload
  const seed = Math.random().toString(36).slice(2, 10);
  const url = `https://picsum.photos/seed/${seed}/800/600`;
  return new Promise((resolve) => {
    setTimeout(() => resolve({ id: `img-${seed}`, url }), 300 + Math.random() * 500);
  });
}

export function mockUploadVideo(
  file: File
): Promise<{ id: string; url: string; duration_seconds: number }> {
  void file; // Phase D: replace with real upload
  const seed = Math.random().toString(36).slice(2, 10);
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          id: `vid-${seed}`,
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration_seconds: 10,
        }),
      500 + Math.random() * 1000
    );
  });
}
