import React, { useState, useEffect } from 'react';
import { QUIZ_QUESTIONS, QuizQuestion } from '../../engine/learning/quizData';
import { 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  HelpCircle, 
  Award,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const LearningModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'QUIZ' | 'NOTES' | 'IC_PINOUTS'>('QUIZ');

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredQuestions = categoryFilter === 'ALL'
    ? QUIZ_QUESTIONS
    : QUIZ_QUESTIONS.filter(q => q.category === categoryFilter);

  const currentQ = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];
  const userAns = selectedAnswers[currentQ?.id];

  const handleSelectOption = (idx: number) => {
    if (userAns !== undefined) return; // already answered
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: idx,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowExplanation(false);
  };

  // Calculate score
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = Object.entries(selectedAnswers).filter(([qId, ansIdx]) => {
    const q = QUIZ_QUESTIONS.find(item => item.id === qId);
    return q && q.correctIndex === ansIdx;
  }).length;

  const categories = ['ALL', 'Logic Gates', 'Boolean Algebra', 'K-Maps', 'Combinational', 'Sequential', 'Number Systems'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Digital Electronics Learning & Practice Lab
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Curated digital logic reference notes, 7400-series IC pinouts, and 18+ verified interactive quizzes with instant scoring
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('QUIZ')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'QUIZ'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Interactive Quizzes ({filteredQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('NOTES')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'NOTES'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Theorems & Laws Reference</span>
        </button>

        <button
          onClick={() => setActiveTab('IC_PINOUTS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'IC_PINOUTS'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>7400-Series IC Guide</span>
        </button>
      </div>

      {/* Tab 1: Interactive Quizzes */}
      {activeTab === 'QUIZ' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Card (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setCurrentQuestionIndex(0);
                    setShowExplanation(false);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Question Display Card */}
            {currentQ && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded">
                      Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Category: <strong className="text-slate-200">{currentQ.category}</strong>
                    </span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    currentQ.difficulty === 'Beginner' ? 'bg-blue-950 text-blue-400' :
                    currentQ.difficulty === 'Intermediate' ? 'bg-amber-950 text-amber-400' : 'bg-purple-950 text-purple-400'
                  }`}>
                    {currentQ.difficulty}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* 4 Multiple Choice Options */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = userAns === idx;
                    const isCorrect = idx === currentQ.correctIndex;
                    const hasAnswered = userAns !== undefined;

                    let btnClass = 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80';
                    if (hasAnswered) {
                      if (isCorrect) {
                        btnClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold shadow-sm';
                      } else if (isSelected && !isCorrect) {
                        btnClass = 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-bold';
                      } else {
                        btnClass = 'bg-slate-950 text-slate-500 border-slate-800 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={hasAnswered}
                        className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all ${btnClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-400">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span>{opt}</span>
                        </div>
                        {hasAnswered && (
                          <div>
                            {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                            {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-400" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Pedagogical Explanation */}
                {userAns !== undefined && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                    userAns === currentQ.correctIndex
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      <span>{userAns === currentQ.correctIndex ? 'Correct Answer!' : 'Explanation:'}</span>
                    </div>
                    <p>{currentQ.explanation}</p>
                  </div>
                )}

                {/* Question Navigation Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300 font-bold"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentQuestionIndex === filteredQuestions.length - 1}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs text-white font-bold"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Score Tracker (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Live Quiz Score
              </span>
              <div className="text-4xl font-mono font-extrabold text-emerald-400">
                {correctCount} / {answeredCount}
              </div>
              <p className="text-xs text-slate-400">
                Accuracy: {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%
              </p>

              <button
                onClick={handleRestartQuiz}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Practice Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reference Notes */}
      {activeTab === 'NOTES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">Postulates & Fundamental Laws</h3>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li>• Closure: For any binary operation on set {`{0, 1}`}, the result is in {`{0, 1}`}.</li>
              <li>• Identity: A + 0 = A, and A · 1 = A</li>
              <li>• Commutative: A + B = B + A, and A · B = B · A</li>
              <li>• Distributive: A · (B + C) = (A · B) + (A · C)</li>
              <li>• Distributive 2: A + (B · C) = (A + B) · (A + C)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">De Morgan's Theorems</h3>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li>• (A · B)' = A' + B' (NAND equals Bubble-OR)</li>
              <li>• (A + B)' = A' · B' (NOR equals Bubble-AND)</li>
              <li>• Multi-variable: (A · B · C · ... · N)' = A' + B' + C' + ... + N'</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: IC Pinouts Reference */}
      {activeTab === 'IC_PINOUTS' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Standard 7400-Series TTL Integrated Circuits (DIP-14)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { ic: '7400', name: 'Quad 2-Input NAND Gate', desc: '4 independent 2-input NAND gates' },
              { ic: '7402', name: 'Quad 2-Input NOR Gate', desc: '4 independent 2-input NOR gates' },
              { ic: '7404', name: 'Hex Inverter (NOT)', desc: '6 independent NOT inverters' },
              { ic: '7408', name: 'Quad 2-Input AND Gate', desc: '4 independent 2-input AND gates' },
              { ic: '7432', name: 'Quad 2-Input OR Gate', desc: '4 independent 2-input OR gates' },
              { ic: '7486', name: 'Quad 2-Input XOR Gate', desc: '4 independent 2-input XOR gates' },
              { ic: '7474', name: 'Dual D Flip-Flop', desc: 'Dual positive-edge-triggered D flip-flops with Preset & Clear' },
              { ic: '7476', name: 'Dual JK Flip-Flop', desc: 'Dual master-slave JK flip-flops' },
              { ic: '74151', name: '8-to-1 Multiplexer', desc: 'Data selector with 3 select inputs and complementary outputs' },
            ].map(item => (
              <div key={item.ic} className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-emerald-400">IC {item.ic}</span>
                  <span className="text-[10px] font-mono text-slate-500">TTL Standard</span>
                </div>
                <h4 className="text-xs font-bold text-white">{item.name}</h4>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
