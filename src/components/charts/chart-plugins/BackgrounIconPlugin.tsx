export const BackgroundIconPlugin = {
    id: 'backgroundIconPlugin',
    // Draw *before* the datasets are drawn
    beforeDatasetsDraw: (chart: any) => {
        const { ctx, chartArea, scales } = chart;

        // Ensure chartArea and scales are available
        if (!chartArea || !scales.x || !scales.y) {
            return;
        }

        ctx.save();

        // --- Icon Style ---
        const iconSize = Math.min(chartArea.width / 4, chartArea.height * 0.6); // Adjust size logic as needed
        // IMPORTANT: Ensure "bootstrap-icons" matches the font-family in your CSS
        ctx.font = `bold ${iconSize}px "bootstrap-icons"`;
        // Use rgba for transparency, or set globalAlpha separately
        ctx.fillStyle = 'rgba(52, 52, 52, 0.08)'; // Very light grey, semi-transparent
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Center vertically

        // Find the zero lines
        const midPoint = scales.x.getPixelForValue(0);

        // Calculate icon positions (centered in each half)
        const iconY = chartArea.top + chartArea.height / 2; // Vertical center

        // Position Male icon in the center of the left half
        if (chartArea.left < midPoint) {
            const maleIconX = chartArea.left + (midPoint - chartArea.left) / 2;
            ctx.fillText('\u2642', maleIconX, iconY); // Male symbol unicode
        }

        // Position Female icon in the center of the right half
        if (chartArea.right > midPoint) {
            const femaleIconX = midPoint + (chartArea.right - midPoint) / 2;
            ctx.fillText('\u2640', femaleIconX, iconY); // Female symbol unicode
        }

        ctx.restore();
    }
};