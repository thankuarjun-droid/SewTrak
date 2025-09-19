// FIX: Update to new GoogleGenAI import and initialization according to the new API guidelines.
import { GoogleGenAI, Type } from "@google/genai";
import { Style, LineAllocation, Employee, Line, Order, KanbanEntry, ProductionEntry, EndLineCheck, MasterDataItem } from "../types";

// This would typically be in your environment variables
const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({apiKey: API_KEY!});

// For this project, we will mock the service.
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface AIPlanResponse {
  overallSummary: string;
  linesPlan: {
    lineId: string;
    lineName: string;
    plan: { date: string; quantity: number, colorId: string }[];
  }[];
  recommendations: {
    lineName: string;
    recommendationScore: number;
    summary: string;
    checklist: { factor: string; reason: string; score: number }[];
  }[];
}


export const getProductionInsights = async (
  lineName: string,
  orderName: string,
  opChartData: any[],
  bottleneck: any,
  efficiency: number
): Promise<string> => {
  await delay(1500);
  const bottleneckInfo = bottleneck ? `The current bottleneck is **${bottleneck.opName}** with a WIP of **${bottleneck.wip} units**.` : "There are no significant bottlenecks at the moment.";
  return `### Production Insights for ${lineName}
*   **Overall Efficiency:** The line is running at **${efficiency.toFixed(1)}%** efficiency for order ${orderName}.
*   **Bottleneck Analysis:** ${bottleneckInfo}
### Recommendations
*   **To clear the bottleneck:** Consider allocating an additional operator to ${bottleneck?.opName} or checking the machine for issues.
*   **To improve efficiency:** Focus on reducing downtime between operations. The transition from *Side Seam* to *Hemming* shows a slight delay.
  `;
};

export const getOperatorPerformanceAnalysis = async (operatorData: any): Promise<string> => {
    await delay(1000);
    const { employeeName, standardCapacity, actualPerformance, efficiency } = operatorData;
    if (standardCapacity > 0 && actualPerformance > 0) {
        const performanceRatio = (actualPerformance / standardCapacity) * 100;
        if (performanceRatio >= 95) {
            return `${employeeName} is performing exceptionally, exceeding standard capacity.`;
        } else if (performanceRatio >= 80) {
            return `${employeeName} is performing well, meeting expectations.`;
        } else {
            return `${employeeName} is performing below standard. Potential areas for improvement include skill training or machine check-ups.`;
        }
    }
    if(efficiency > 0) {
        return `Efficiency is at ${efficiency.toFixed(1)}%. Check if a time study is available to compare against standard capacity.`;
    }
    return 'Not enough data for a full analysis. A time study might be required.';
}

export const getPageLevelAnalysis = async (data: any[], operationName: string): Promise<string> => {
    await delay(2000);
    const avgEfficiency = data.reduce((sum, d) => sum + d.efficiency, 0) / data.length;
    const topPerformer = data.sort((a, b) => b.efficiency - a.efficiency)[0];
    const lowPerformer = data.sort((a, b) => a.efficiency - b.efficiency)[0];
    
    return `### Analysis for ${operationName}
**Overall Performance**: The average efficiency for this operation is **${avgEfficiency.toFixed(1)}%**.

**Top Performer**: **${topPerformer.employeeName}** is the top performer with an efficiency of **${topPerformer.efficiency.toFixed(1)}%**. Their work method breakdown could be a model for training others.

**Area for Improvement**: **${lowPerformer.employeeName}** is currently at **${lowPerformer.efficiency.toFixed(1)}%** efficiency. They may benefit from additional training or support.

**Actionable Insight**: Consider pairing **${lowPerformer.employeeName}** with **${topPerformer.employeeName}** for a short period to share best practices and improve overall team performance.`;
}

// FIX: Define missing helper functions to handle date conversions.
const toUtcDate = (dateStr: string): Date => new Date(dateStr + 'T12:00:00Z');
const toYyyyMmDd = (date: Date): string => date.toISOString().split('T')[0];

export const getAIPlanSuggestion = async (
    order: Order, 
    style: Style, 
    lines: Line[], 
    employees: Employee[], 
    lineAllocations: LineAllocation[],
    nextAvailableDates: Map<string, string>,
    remainingQuantities: Map<string, number>,
    userRequest: string,
    colorSequence: { colorId: string, startDate: string }[],
    numLines: number,
    allStyles: Style[],
    productionEntries: ProductionEntry[],
    endLineChecks: EndLineCheck[],
    defects: MasterDataItem[],
    kanbanEntries?: KanbanEntry[],
    kanbanSettings?: { maxActiveCardsPerLine: number }
): Promise<AIPlanResponse> => {
    const totalSmv = style.operationBulletin.reduce((sum, op) => sum + op.pickupTime + op.sewingTime + op.trimAndDisposalTime, 0) / 60;
    const requiredOperators = style.operationBulletin.reduce((sum, op) => sum + (op.allocatedOperators || 1), 0);

    const defectsMap = new Map(defects.map(d => [d.id, d.name]));

    const linesWithHistoricalData = lines.map(line => {
        const lineEmployees = employees.filter(e => e.currentLineId === line.id);
        
        // Find styles with similar fabric
        const similarStyleIds = new Set(allStyles.filter(s => s.fabric === style.fabric).map(s => s.id));
        
        // Calculate historical efficiency on similar styles
        const relevantProdEntries = productionEntries.filter(p => p.lineNumber === line.id && similarStyleIds.has(p.styleNumber));
        let avgEfficiencyOnSimilar = 75; // Default fallback
        if (relevantProdEntries.length > 0) {
            const totalSmvProduced = relevantProdEntries.reduce((sum, entry) => {
                const s = allStyles.find(st => st.id === entry.styleNumber);
                const op = s?.operationBulletin.find(ob => ob.operationId === entry.operation);
                const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
                return sum + (smv * entry.productionQuantity);
            }, 0);
            const uniqueHours = new Set(relevantProdEntries.map(p => `${p.timestamp.split('T')[0]}-${p.employeeId}-${p.hourCounter}`)).size;
            if (uniqueHours > 0) {
                avgEfficiencyOnSimilar = (totalSmvProduced / (uniqueHours * 60)) * 100;
            }
        }

        // Calculate historical quality on similar styles
        const relevantChecks = endLineChecks.filter(c => c.lineNumber === line.id && similarStyleIds.has(c.styleNumber));
        let avgDefectRateOnSimilar = 3; // Default fallback
        if (relevantChecks.length > 0) {
            const defectsFound = relevantChecks.filter(c => c.status === 'Rework' || c.status === 'Reject').length;
            avgDefectRateOnSimilar = (defectsFound / relevantChecks.length) * 100;
        }

        // Calculate top defects
        const topDefectsOnSimilarStyles = new Map<string, number>();
        relevantChecks.forEach(c => {
            if (c.defectId && (c.status === 'Rework' || c.status === 'Reject')) {
                const defectName = defectsMap.get(c.defectId) || 'Unknown';
                topDefectsOnSimilarStyles.set(defectName, (topDefectsOnSimilarStyles.get(defectName) || 0) + 1);
            }
        });
        const topDefectsArray = Array.from(topDefectsOnSimilarStyles.entries())
            .sort((a,b) => b[1] - a[1])
            .slice(0, 3)
            .map(([defectName, count]) => ({ defectName, count }));

        // Calculate recent downtime
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentProdEntries = productionEntries.filter(p => p.lineNumber === line.id && new Date(p.timestamp) >= thirtyDaysAgo);
        const uniqueDaysWithProd = new Set(recentProdEntries.map(p => p.timestamp.split('T')[0])).size;
        const totalRecentDowntime = recentProdEntries.reduce((sum, p) => sum + p.downTime, 0);
        const avgDailyDowntime = uniqueDaysWithProd > 0 ? totalRecentDowntime / uniqueDaysWithProd : 30; // Default fallback

        // Calculate top downtime reasons
        const topDowntimeReasons = new Map<string, number>();
        recentProdEntries.forEach(p => {
            if (p.downTime > 0 && p.downTimeReason) {
                topDowntimeReasons.set(p.downTimeReason, (topDowntimeReasons.get(p.downTimeReason) || 0) + p.downTime);
            }
        });
        const topDowntimeArray = Array.from(topDowntimeReasons.entries())
            .sort((a,b) => b[1] - a[1])
            .slice(0, 3)
            .map(([reason, minutes]) => ({ reason, totalMinutes: Math.round(minutes) }));

        const availableOperators = lineEmployees.filter(e => e.designation.toLowerCase().includes('operator')).length;
        const skillMix = lineEmployees.reduce((acc, emp) => {
            acc[emp.operatorGradeId] = (acc[emp.operatorGradeId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const activeCards = (kanbanEntries || []).filter(k => k.lineNumber === line.id && k.status === 'active').length;
        const wipLoad = activeCards > 2 ? 'High' : activeCards > 0 ? 'Medium' : 'Low';
        
        const nextAvailableDateStr = nextAvailableDates.get(line.id) || new Date().toISOString();
        const daysUntilAvailable = Math.max(0, Math.round((new Date(nextAvailableDateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));

        return {
            lineId: line.id,
            lineName: line.name,
            availableOperators,
            requiredOperators,
            operatorSkillMix: skillMix,
            historicalPerformance: {
                avgEfficiencyOnSimilarStyles: parseFloat(avgEfficiencyOnSimilar.toFixed(1)),
                avgDefectRateOnSimilarStyles: parseFloat(avgDefectRateOnSimilar.toFixed(1)),
                avgDailyDowntimeMinutes: parseFloat(avgDailyDowntime.toFixed(1)),
                topDefectsOnSimilarStyles: topDefectsArray,
                topDowntimeReasons: topDowntimeArray,
            },
            currentWIPLoad: wipLoad,
            daysUntilAvailable
        };
    });

    const candidateLines = linesWithHistoricalData.sort((a,b) => a.daysUntilAvailable - b.daysUntilAvailable).slice(0, numLines * 2);

    if (candidateLines.length === 0) {
        return { overallSummary: "No suitable lines found.", linesPlan: [], recommendations: [] };
    }
    
    const totalOrderQty = Array.from(remainingQuantities.values()).reduce((s,q) => s + q, 0);
    const prompt = `
        You are an expert production planning AI for the garment industry. Your task is to analyze candidate manufacturing lines and predict their performance for a new order. Provide your answer ONLY in JSON format.

        **Style Information:**
        - Style Name: ${style.name}
        - Total SMV (Standard Minute Value): ${totalSmv.toFixed(2)} minutes
        - Number of Operations: ${style.operationBulletin.length}
        - Fabric Type: ${style.fabric || 'Not specified'}
        - Required Operators per line: ${requiredOperators}

        **Order Information:**
        - Total Remaining Order Quantity: ${Math.round(totalOrderQty)} units

        **Candidate Line Data (with detailed historical performance):**
        ${JSON.stringify(candidateLines, null, 2)}

        Analyze the "Candidate Line Data" and for the top ${numLines} lines, return a JSON array with the following schema for each:
        - lineId: string (must match one of the input line IDs)
        - predictedOutput: integer (your prediction for daily output in units, based on all historical data)
        - recommendationScore: integer (a score from 0-100 indicating how suitable the line is)
        - reasoning: string (a brief, single-sentence explanation for the prediction and score, referencing the detailed historical data provided, like top defects or downtime reasons)
        - checklist: An array of objects, each with:
            - factor: string (e.g., "Skill Match", "Historical Efficiency", "Historical Quality", "Top Defect Types", "Recent Downtime", "Top Downtime Reasons", "WIP Load")
            - reason: string (a short justification for the score, e.g., "Avg 82.5% on similar styles.", or "Top defect is 'Skip Stitch', which is minor.")
            - score: integer (a score from 0-100 for that specific factor)
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                lineId: { type: Type.STRING },
                predictedOutput: { type: Type.INTEGER },
                recommendationScore: { type: Type.INTEGER },
                reasoning: { type: Type.STRING },
                checklist: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            factor: { type: Type.STRING },
                            reason: { type: Type.STRING },
                            score: { type: Type.INTEGER },
                        },
                        required: ['factor', 'reason', 'score']
                    }
                }
            },
            required: ['lineId', 'predictedOutput', 'recommendationScore', 'reasoning', 'checklist']
        }
    };
    
    let geminiResults: {
        lineId: string, 
        predictedOutput: number, 
        recommendationScore: number, 
        reasoning: string, 
        checklist: { factor: string, reason: string, score: number }[]
    }[] = [];
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        geminiResults = JSON.parse(response.text);
    } catch(e) {
        console.error("Gemini API call failed:", e);
        // Fallback logic
        const fallbackOutput = totalSmv > 0 ? (requiredOperators * 8 * 60 * 0.80) / totalSmv : 150;
        geminiResults = candidateLines.slice(0, numLines).map(l => ({
            lineId: l.lineId,
            predictedOutput: Math.round(fallbackOutput),
            recommendationScore: 70,
            reasoning: "AI prediction failed. Using standard calculation.",
            checklist: [{ factor: "Fallback", reason: "Standard calculation used.", score: 70 }]
        }));
    }

    const bestLinesData = geminiResults.sort((a,b) => b.recommendationScore - a.recommendationScore);
    
    const outputMap = new Map(bestLinesData.map(p => [p.lineId, p.predictedOutput]));
    
    const linesPlan: AIPlanResponse['linesPlan'] = bestLinesData.map(l => ({
        lineId: l.lineId,
        lineName: lines.find(line => line.id === l.lineId)?.name || '',
        plan: []
    }));
    
    let remainingQtyByColor = new Map(remainingQuantities);
    let continuePlanning = true;
    let daysOffset = 0;
    
    while(continuePlanning) {
        for (const lineData of bestLinesData) {
            const lineId = lineData.lineId;
            const nextAvailableDateStr = nextAvailableDates.get(lineId) || toYyyyMmDd(new Date());
            const startDate = toUtcDate(nextAvailableDateStr);
            const planDate = new Date(startDate);
            planDate.setUTCDate(planDate.getUTCDate() + daysOffset);
            if(planDate.getUTCDay() === 0) continue; 

            const dateStr = toYyyyMmDd(planDate);
            let plannedForDay = 0;
            const dailyTargetPerLine = outputMap.get(lineId) || 150;
            
            for (const color of colorSequence) {
                const colorStartDate = toUtcDate(color.startDate);
                if (planDate < colorStartDate) continue;

                const remainingForColor = remainingQtyByColor.get(color.colorId) || 0;
                if (remainingForColor > 0) {
                    const qtyToPlan = Math.min(remainingForColor, dailyTargetPerLine - plannedForDay);
                    if (qtyToPlan > 0) {
                        const planForItem = linesPlan.find(lp => lp.lineId === lineId)!;
                        planForItem.plan.push({ date: dateStr, quantity: Math.round(qtyToPlan), colorId: color.colorId });
                        remainingQtyByColor.set(color.colorId, remainingForColor - qtyToPlan);
                        plannedForDay += qtyToPlan;
                    }
                }
                if (plannedForDay >= dailyTargetPerLine) break;
            }
        }
        daysOffset++;
        const totalStillRemaining = Array.from(remainingQtyByColor.values()).reduce((s,q) => s + q, 0);
        if (totalStillRemaining < 1 || daysOffset > 100) continuePlanning = false;
    }

    return {
        overallSummary: `Based on your request "${userRequest}", Gemini has generated a plan using the top ${bestLinesData.length} line(s). The best option is **${lines.find(l=>l.id===bestLinesData[0].lineId)?.name}**.`,
        linesPlan,
        recommendations: bestLinesData.map(l => ({
            lineName: lines.find(line => line.id === l.lineId)?.name || '',
            recommendationScore: l.recommendationScore,
            summary: l.reasoning,
            checklist: l.checklist
        }))
    };
};