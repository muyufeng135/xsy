/**
 * Excel 公式计算：IF(flag, CEILING(b4*(1+b2)/g5, 1)*2+b8, CEILING(b4*(1+b2)/g5, 1)+b8)
 * @param {boolean} flag - 为 true 时执行 CEILING*2+B8，为 false 时执行 CEILING+B8
 * @param {number} pointBuff - 对应 Excel B4 单元格
 * @param {number} spare - 对应 Excel $B$2 单元格，此值是一个百分数
 * @param {number} inputModule - 对应 Excel G5 单元格
 * @param {number} moduleAdd - 对应 Excel B8 单元格
 * @returns {number}
 */
function calcMouduleQuantity(flag, points, spare, slotCount, moduleAdd) {
    debugger
    points = points || 0;
    spare = spare || 0;
    moduleAdd = moduleAdd || 0;
    if (!slotCount || slotCount === 0) return 0;
    var base = Math.ceil(points * (1 + spare) / slotCount);
    return flag ? base * 2 + moduleAdd : base + moduleAdd;
}
