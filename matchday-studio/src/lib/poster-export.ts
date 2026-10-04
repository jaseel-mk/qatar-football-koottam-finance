export async function downloadPosterPNG(svg: SVGSVGElement, filename: string): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '2400');
  clone.setAttribute('height', '3200');
  clone.style.width = '2400px';
  clone.style.height = '3200px';
  const source = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = source;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 3200;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas not supported');
    context.fillStyle = '#0a0a0a';
    context.fillRect(0, 0, 2400, 3200);
    context.drawImage(image, 0, 0, 2400, 3200);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('PNG encoding failed')), 'image/png');
    });
    const download = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = download;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(download), 1000);
  } finally {
    URL.revokeObjectURL(source);
  }
}
