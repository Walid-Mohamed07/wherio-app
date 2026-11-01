'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Navigation,
  Star,
  Send,
  ShieldCheck,
  Car,
  Footprints,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { AwfarApi, CountryCode, LangCode } from '@/lib/api';

interface AiConciergeTabProps {
  country: CountryCode;
  lang: LangCode;
  cityId?: string;
  userCoords: { lat: number; lng: number; label: string };
  onSelectPlace: (placeId: string) => void;
}

interface ChatTurn {
  id: string;
  userQuery: string;
  isVoiceOrigin?: boolean;
  response: any;
  timestamp: string;
  feedback?: 'HELPFUL' | 'NOT_HELPFUL';
}

export default function AiConciergeTab({
  country,
  lang,
  cityId,
  userCoords,
  onSelectPlace,
}: AiConciergeTabProps) {
  const isAr = lang === 'ar';
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceStatusBanner, setVoiceStatusBanner] = useState<string | null>(
    null,
  );
  const [autoReadAloud, setAutoReadAloud] = useState<boolean>(true);
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);
  const [showGuardrailsInfo, setShowGuardrailsInfo] = useState<boolean>(false);

  const [conversationId, setConversationId] = useState<string>(
    `conv-${Date.now()}`,
  );
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);

  const handleStartNewConversation = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingTurnId(null);
    setConversationId(`conv-${Date.now()}`);
    setChatHistory([]);
    setQueryText('');
    setVoiceStatusBanner(null);
  };

  // Speak text aloud using Browser Web Speech Synthesis (Read Recommendations Aloud)
  const handleReadAloud = (
    turnId: string,
    text: string,
    speechLangCode = isAr ? 'ar-SA' : 'en-US',
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceStatusBanner(
        isAr
          ? 'متصفحك الحالي لا يدعم القراءة الصوتية التلقائية.'
          : 'Your browser does not support Web Speech Synthesis.',
      );
      return;
    }

    if (speakingTurnId === turnId) {
      window.speechSynthesis.cancel();
      setSpeakingTurnId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLangCode;
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingTurnId(null);
    utterance.onerror = () => setSpeakingTurnId(null);
    setSpeakingTurnId(turnId);
    window.speechSynthesis.speak(utterance);
  };

  const handleRunConcierge = async (
    textToSearch?: string,
    isVoiceInput = false,
  ) => {
    const finalQuery = (textToSearch ?? queryText).trim();
    if (!finalQuery) return;
    setQueryText('');
    setLoading(true);
    try {
      const res = await AwfarApi.askVoiceConcierge(
        {
          voiceTranscript: finalQuery,
          conversationId,
          isVoiceInput,
          cityId,
          lat: userCoords.lat,
          lng: userCoords.lng,
          radiusKm: 50,
        },
        country,
        lang,
      );
      if (res?.conversationId) {
        setConversationId(res.conversationId);
      }
      const turnId = `turn-${Date.now()}`;
      setChatHistory((prev) => [
        {
          id: turnId,
          userQuery: finalQuery,
          isVoiceOrigin: isVoiceInput,
          response: res,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ]);

      // Automatically read aloud if voice input was used or autoReadAloud is enabled on voice turns
      if (
        isVoiceInput &&
        autoReadAloud &&
        res?.voiceAssistantReply?.spokenResponseText
      ) {
        handleReadAloud(
          turnId,
          res.voiceAssistantReply.spokenResponseText,
          res.voiceAssistantReply.speechLangCode || (isAr ? 'ar-SA' : 'en-US'),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Voice Recognition Input (Speak to Concierge via Web Speech API + Backend Dialect Normalizer)
  const handleStartVoiceRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceStatusBanner(
        isAr
          ? 'تم تفعيل المحاكاة الصوتية السريعة (متصفحك لا يدعم Web Speech API مباشرة)'
          : 'Simulated voice capture used (Web Speech API requires Chrome/Edge)',
      );
      const sampleSpoken = isAr
        ? 'عايز أخرج مع عيلتي في أبوظبي، مكان مناسب للأطفال وفيه باركينج'
        : 'Find a family friendly restaurant with parking and outdoor seating';
      handleRunConcierge(sampleSpoken, true);
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    const speechLocale = isAr
      ? country === 'AE'
        ? 'ar-AE'
        : 'ar-SA'
      : 'en-US';
    recognition.lang = speechLocale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListeningVoice(true);
    setVoiceStatusBanner(
      isAr
        ? '🎙️ تحدث الآن بالعربية أو الإنجليزية... جاري الاستماع لطلبك'
        : '🎙️ Speak now in English or Arabic... Listening to your request',
    );

    recognition.onresult = async (event: any) => {
      const rawTranscript = event?.results?.[0]?.[0]?.transcript || '';
      setIsListeningVoice(false);
      if (rawTranscript.trim()) {
        setVoiceStatusBanner(
          isAr
            ? `تم التعرف الصوتي: "${rawTranscript}"`
            : `Voice Recognized: "${rawTranscript}"`,
        );
        try {
          const norm = await AwfarApi.transcribeVoice(
            rawTranscript,
            speechLocale,
            country,
            lang,
          );
          await handleRunConcierge(
            norm?.normalizedTranscript || rawTranscript,
            true,
          );
        } catch {
          await handleRunConcierge(rawTranscript, true);
        }
      }
    };

    recognition.onerror = () => {
      setIsListeningVoice(false);
      setVoiceStatusBanner(
        isAr
          ? 'تعذر الوصول للميكروفون — يرجى السماح بصلاحية الميكروفون أو كتابة طلبك نصياً.'
          : 'Microphone unavailable — please allow microphone access or type your request.',
      );
    };

    recognition.onend = () => {
      setIsListeningVoice(false);
    };

    recognition.start();
  };

  // Log AI Feedback (Helpful / Not Helpful)
  const handleSendFeedback = async (
    turnId: string,
    convId: string,
    rating: 'HELPFUL' | 'NOT_HELPFUL',
  ) => {
    setChatHistory((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, feedback: rating } : t)),
    );
    try {
      await AwfarApi.submitAiFeedback(
        {
          conversationId: convId || conversationId,
          rating,
        },
        country,
        lang,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const quickPrompts = isAr
    ? [
        'عايز أخرج مع عيلتي في أبوظبي، مكان مناسب للأطفال وفيه باركينج وميزانية متوسطة',
        'رشح لي أكواريوم أو نشاط ترفيهي في أبوظبي (مع توضيح البيانات غير المتوفرة)',
        'أفضل مقهى قهوة مختصة هادئ للعمل في الرياض مع واي فاي ومواقف سيارات',
        'أبغى مكان حلو اليوم (اختبار الأسئلة التوضيحية للمساعد الذكي)',
      ]
    : [
        'Family outing in Abu Dhabi, kids friendly with parking and moderate budget',
        'Show me aquariums in Abu Dhabi (with missing data disclosure)',
        'Best quiet specialty coffee cafe in Riyadh with Wi-Fi and parking',
        'Where should I go today? (Test clarifying questions)',
      ];

  return (
    <div className="space-y-4 pb-24">
      {/* Conversational & Voice AI Concierge Header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#072549] via-[#0A2E5C] to-[#0072DC] p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B89C]/25 text-[#00D2B4] ring-1 ring-[#00D2B4]/40 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {isAr ? 'مساعد ويريو الذكي (نص + صوت)' : 'Wherio AI Concierge (Text & Voice)'}
              </h2>
              <p className="text-[11px] text-sky-100/90">
                {isAr
                  ? 'يدعم البحث الصوتي والنصي وقراءة التوصيات بصوت مسموع مع التزام صارم بدقة البيانات'
                  : 'Supports Voice Recognition, Spoken Audio Replies & Zero-Hallucination Grounding'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoReadAloud((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${
                autoReadAloud
                  ? 'bg-[#00B89C] text-white'
                  : 'bg-white/15 text-sky-100'
              }`}
              title={
                isAr
                  ? 'قراءة توصيات البحث الصوتي تلقائياً'
                  : 'Auto-read voice search recommendations aloud'
              }
            >
              {autoReadAloud ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              <span>{isAr ? 'نطق صوتي' : 'TTS'}</span>
            </button>

            {chatHistory.length > 0 && (
              <button
                onClick={handleStartNewConversation}
                className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1.5 text-[10px] font-bold hover:bg-white/25"
                title={isAr ? 'بدء محادثة جديدة' : 'Start New Conversation'}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isAr ? 'جديد' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Zero-Hallucination & Guardrail Policy Pill */}
        <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-[11px] text-sky-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#00D2B4]" />
              <span>
                {isAr
                  ? 'حماية صارمة: يعتمد فقط على الأماكن المنشورة ويرفض الأسئلة خارج النطاق.'
                  : 'Strict Guardrails: Grounded in published Wherio places with off-topic refusal.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowGuardrailsInfo((prev) => !prev)}
              className="shrink-0 underline font-bold text-[#FFC233]"
            >
              {showGuardrailsInfo
                ? isAr
                  ? 'إخفاء القواعد'
                  : 'Hide Rules'
                : isAr
                  ? 'قواعد التقييد'
                  : 'View 5 Rules'}
            </button>
          </div>

          {showGuardrailsInfo && (
            <ul className="mt-2 space-y-1 border-t border-white/15 pt-2 text-[10px] text-sky-50">
              <li>
                •{' '}
                {isAr
                  ? '١. لا يرشح إلا الأماكن المنشورة (PUBLISHED) في قاعدة بيانات ويريو.'
                  : '1. Recommends strictly from PUBLISHED Wherio records only.'}
              </li>
              <li>
                •{' '}
                {isAr
                  ? '٢. يفصح صراحةً عن أي أسعار أو مرافق غير معروفة (UNKNOWN) دون تخمين.'
                  : '2. Explicitly discloses UNKNOWN prices or facilities without guessing.'}
              </li>
              <li>
                •{' '}
                {isAr
                  ? '٣. يرفض الأسئلة خارج نطاق الأماكن ومحاولات تجاوز التعليمات (Prompt Injection).'
                  : '3. Blocks prompt-injection and off-topic domain queries.'}
              </li>
              <li>
                •{' '}
                {isAr
                  ? '٤. يطرح أسئلة توضيحية عند غموض الطلب.'
                  : '4. Asks clarifying questions when intent is ambiguous.'}
              </li>
              <li>
                •{' '}
                {isAr
                  ? '٥. حد أقصى ٥ ترشيحات مفسرة مع حماية ضد الطلبات الآلية المتكررة.'
                  : '5. Capped at top 5 matches per turn with rate-limit protection.'}
              </li>
            </ul>
          )}
        </div>

        {/* Text Chat Input + Speak to Concierge Microphone Button */}
        <div className="mt-3.5 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunConcierge()}
              placeholder={
                isAr
                  ? 'اكتب طلبك أو اضغط على الميكروفون للتحدث صوتياً...'
                  : 'Type your outing request or tap the Mic to speak...'
              }
              className="w-full rounded-xl bg-white px-3.5 py-3 pr-10 text-xs font-medium text-[#072549] placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={() => handleRunConcierge()}
              disabled={loading}
              className={`absolute top-1/2 -translate-y-1/2 rounded-lg bg-[#0072DC] p-1.5 text-white hover:bg-[#072549] ${
                isAr ? 'left-2' : 'right-2'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Speak to Concierge Voice Button */}
          <button
            type="button"
            onClick={handleStartVoiceRecognition}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-extrabold shadow-md transition ${
              isListeningVoice
                ? 'animate-pulse bg-rose-600 text-white ring-4 ring-rose-400/50'
                : 'bg-[#00B89C] text-white hover:bg-[#008891]'
            }`}
            title={
              isAr
                ? 'تحدث إلى المساعد الذكي (بحث صوتي)'
                : 'Speak to Concierge (Voice Search)'
            }
          >
            {isListeningVoice ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        </div>

        {voiceStatusBanner && (
          <p className="mt-2 rounded-lg bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-[#FFC233]">
            {voiceStatusBanner}
          </p>
        )}

        {/* Sample Compound Prompts */}
        <div className="mt-3.5">
          <p className="mb-1.5 text-[11px] font-semibold text-sky-100">
            {isAr
              ? 'جرب أحد سيناريوهات البحث النصي أو الصوتي المركب:'
              : 'Try a sample conversational discovery request:'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleRunConcierge(prompt)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-black/25 px-2.5 py-1.5 text-left text-[11px] leading-snug text-white backdrop-blur transition hover:bg-black/40"
              >
                <MessageSquare className="h-3 w-3 shrink-0 text-[#FFC233]" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-[#0072DC]/30 bg-[#0072DC]/5 p-4 text-center text-xs font-bold text-[#072549] animate-pulse">
          {isAr
            ? 'جاري تحليل شروطك ومراجعة الأماكن المنشورة في ويريو...'
            : 'Analyzing requirements against published Wherio places...'}
        </div>
      )}

      {/* Multi-Turn Chat History */}
      {chatHistory.map((turn) => {
        const aiResult = turn.response;
        const isSpeakingThis = speakingTurnId === turn.id;
        return (
          <div
            key={turn.id}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs"
          >
            {/* User Message Bubble */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 rounded-xl bg-[#072549] px-3 py-2 text-xs font-bold text-white">
                {turn.isVoiceOrigin && (
                  <Mic className="h-3.5 w-3.5 shrink-0 text-[#00D2B4]" />
                )}
                <span>“{turn.userQuery}”</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {turn.timestamp}
              </span>
            </div>

            {/* AI Concierge Reply + Read Aloud Button */}
            <div className="rounded-xl border border-[#00B89C]/30 bg-[#00B89C]/8 p-3">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#072549] px-2.5 py-0.5 text-[10px] font-bold text-white">
                    <Sparkles className="h-3 w-3 text-[#FFC233]" />
                    {isAr ? 'رد مساعد ويريو' : 'Wherio Concierge Reply'}
                  </span>
                  {aiResult.modelMetadata?.activeModel && (
                    <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                      {aiResult.modelMetadata.activeModel}
                    </span>
                  )}
                </div>

                {/* Read Recommendations Aloud Button */}
                {aiResult.voiceAssistantReply?.spokenResponseText && (
                  <button
                    type="button"
                    onClick={() =>
                      handleReadAloud(
                        turn.id,
                        aiResult.voiceAssistantReply.spokenResponseText,
                        aiResult.voiceAssistantReply.speechLangCode ||
                          (isAr ? 'ar-SA' : 'en-US'),
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold transition ${
                      isSpeakingThis
                        ? 'bg-rose-600 text-white'
                        : 'bg-[#0072DC] text-white hover:bg-[#072549]'
                    }`}
                  >
                    {isSpeakingThis ? (
                      <>
                        <VolumeX className="h-3 w-3" />
                        <span>{isAr ? 'إيقاف القراءة' : 'Stop Audio'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3 w-3" />
                        <span>
                          {isAr ? 'استمع للتوصية صوتياً' : 'Read Aloud'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-xs font-medium leading-relaxed text-slate-800">
                {aiResult.voiceAssistantReply?.spokenResponseText}
              </p>

              {/* Clarifying Questions when Ambiguous */}
              {aiResult.voiceAssistantReply?.needsClarification &&
                aiResult.voiceAssistantReply?.clarifyingQuestions?.length >
                  0 && (
                  <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-900">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-700" />
                      <span>
                        {isAr
                          ? 'أسئلة توضيحية لتضييق نطاق البحث (اضغط للاختيار):'
                          : 'Clarifying Questions to narrow down your search:'}
                      </span>
                    </div>
                    <ul className="mt-1 space-y-1 text-[11px] text-amber-800">
                      {aiResult.voiceAssistantReply.clarifyingQuestions.map(
                        (q: string, idx: number) => (
                          <li key={idx}>• {q}</li>
                        ),
                      )}
                    </ul>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        isAr
                          ? 'نشاط ترفيهي عائلي مناسب للأطفال مع باركينج'
                          : 'Family entertainment, kids friendly with parking',
                        isAr
                          ? 'مطعم عائلي بجلسات داخلية وموقف سيارات'
                          : 'Family restaurant with indoor seating & parking',
                        isAr
                          ? 'مقهى قهوة مختصة هادئ مع واي فاي'
                          : 'Quiet specialty cafe with Wi-Fi',
                      ].map((refinement, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => handleRunConcierge(refinement)}
                          className="rounded-lg bg-amber-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-800"
                        >
                          {refinement}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Log AI Feedback Bar (Helpful / Not Helpful) */}
              <div className="mt-2.5 flex items-center justify-between border-t border-[#00B89C]/20 pt-2 text-[10px]">
                <span className="font-semibold text-slate-600">
                  {isAr
                    ? 'هل كانت توصية المساعد الذكي مفيدة؟'
                    : 'Was this recommendation helpful?'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendFeedback(
                        turn.id,
                        aiResult.conversationId,
                        'HELPFUL',
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold transition ${
                      turn.feedback === 'HELPFUL'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span>{isAr ? 'مفيد' : 'Helpful'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendFeedback(
                        turn.id,
                        aiResult.conversationId,
                        'NOT_HELPFUL',
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold transition ${
                      turn.feedback === 'NOT_HELPFUL'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-rose-50'
                    }`}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    <span>{isAr ? 'غير مفيد' : 'Not Helpful'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Explained Recommendations List */}
            {aiResult.matchedPlaces?.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-[#072549]">
                  {isAr
                    ? 'الترشيحات المفسرة مع حالة توفر البيانات:'
                    : 'Explained Recommendations & Data Transparency:'}
                </h4>
                {aiResult.matchedPlaces.map((place: any, idx: number) => (
                  <div
                    key={place.id}
                    className={`rounded-2xl border p-3 transition ${
                      idx === 0
                        ? 'border-2 border-[#0072DC] bg-sky-50/30 shadow-xs'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {idx === 0 && (
                            <span className="rounded-md bg-[#0072DC] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                              {isAr ? 'الترشيح الأول' : '#1 MATCH'}
                            </span>
                          )}
                          <h5 className="text-xs font-extrabold text-[#072549]">
                            {place.name}
                          </h5>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {place.neighborhood} • {place.categoryName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {place.rating?.ratingDisplayText ||
                            place.rating?.avgRating}
                        </span>
                        <p className="text-[9px] text-slate-400">
                          {isAr ? 'تقييم ويريو' : 'Wherio Rating'}
                        </p>
                      </div>
                    </div>

                    {/* Why Recommended */}
                    {place.whyRecommended && (
                      <div className="mt-2 rounded-xl bg-emerald-50/80 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900">
                        <span className="font-extrabold">
                          {isAr ? 'سبب الترشيح: ' : 'Why Recommended: '}
                        </span>
                        {place.whyRecommended}
                      </div>
                    )}

                    {/* Explicit Missing Data Disclosure */}
                    {place.missingDataDisclosure?.length > 0 && (
                      <div className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50/90 px-2.5 py-1.5 text-[11px] text-amber-900">
                        <div className="flex items-start gap-1.5">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <div>
                            <span className="font-extrabold">
                              {isAr
                                ? 'بيانات غير متوفرة حالياً (لا يتم تخمينها): '
                                : 'Missing Data Disclosure (Not Guessed): '}
                            </span>
                            {place.missingDataDisclosure.join(' ')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Distance & Action */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                          <Navigation className="h-2.5 w-2.5 text-[#0072DC]" />
                          {place.distance?.distanceKm} km
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                          <Car className="h-3 w-3 text-[#00B89C]" />
                          {place.distance?.driveTimeMinutes}{' '}
                          {isAr ? 'د بالسيارة' : 'm drive'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                          <Footprints className="h-3 w-3" />
                          {place.distance?.walkTimeMinutes}{' '}
                          {isAr ? 'د مشي' : 'm walk'}
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectPlace(place.id)}
                        className="rounded-xl bg-[#072549] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0072DC]"
                      >
                        {isAr ? 'عرض التفاصيل' : 'View Details'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
