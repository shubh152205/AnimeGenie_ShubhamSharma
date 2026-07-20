import { Cpu } from 'lucide-react';

export default function MLConversionCard({ mlProb }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[180px]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">ML Conversion Prob.</span>
        <Cpu className="h-4 w-4 text-indigo-500" />
      </div>
      <div className="my-3 text-center">
        <span className="text-3xl font-extrabold text-slate-900">{mlProb}%</span>
        <p className="text-[9.5px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Predicted Conversion</p>
      </div>
      <div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
            style={{ width: `${mlProb}%` }}
          />
        </div>
        <span className="text-[8.5px] text-slate-400 font-bold mt-1.5 block text-right">DecisionTree Classifier Prediction</span>
      </div>
    </div>
  );
}
