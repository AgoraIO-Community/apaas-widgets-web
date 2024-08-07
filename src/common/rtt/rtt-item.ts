
export interface FcrRttItem {
    uuid: string;
    culture: string;
    uid: string;
    text: string;
    trans?: {
        culture: string;
        text: string;
    }[];
    time: number;
    isFinal: boolean;
    confidence: number;
    currentTargetLan:string;
}