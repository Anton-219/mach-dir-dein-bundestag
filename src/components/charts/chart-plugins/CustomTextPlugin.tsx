

export const CustomTextPlugin = {
    id: 'customTextPlugin',
    afterDraw: (chart: any) => {
        const {ctx, chartArea} = chart;
        ctx.save();
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#343434';

        // Draw "Male" at bottom left
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Male', chartArea.left + 10, chartArea.bottom - 10);

        // Draw "Female" at bottom right
        ctx.textAlign = 'right';
        ctx.fillText('Female', chartArea.right - 10, chartArea.bottom - 10);
        ctx.restore();
    }
};