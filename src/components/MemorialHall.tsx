import React, { useState } from 'react';
import { Member, MemorialTribute } from '../types';

interface MemorialHallProps {
  members: Member[];
  litCandles: Record<string, boolean>;
  onToggleCandle: (id: string) => void;
  tributes: MemorialTribute[];
  onAddTribute: (tribute: Omit<MemorialTribute, 'id' | 'createdAt'>) => void;
}

export default function MemorialHall({
  members,
  litCandles,
  onToggleCandle,
  tributes,
  onAddTribute,
}: MemorialHallProps) {
  const deceasedMembers = members.filter((m) => m.isDeceased);

  // Tribute Form state (loaded from localStorage if available)
  const [authorName, setAuthorName] = useState(() => localStorage.getItem('gia_pha_saved_author_name') || '');
  const [targetId, setTargetId] = useState('');
  const [content, setContent] = useState('');

  // Candle modal state
  const [showCandleModal, setShowCandleModal] = useState(false);
  const [candleMember, setCandleMember] = useState<Member | null>(null);
  const [candleAuthor, setCandleAuthor] = useState(() => localStorage.getItem('gia_pha_saved_author_name') || '');
  const [candleContent, setCandleContent] = useState('');

  const openCandleModal = (member: Member) => {
    setCandleMember(member);
    setCandleContent(`Kính dâng nén tâm hương, thành tâm tưởng niệm và tri ân sâu sắc công đức cao dày của Cụ/Ông/Bà ${member.name}. Nguyện cầu anh linh cụ độ trì bảo hộ cho con cháu luôn bình an, mạnh khỏe và thịnh vượng.`);
    const savedName = localStorage.getItem('gia_pha_saved_author_name') || '';
    setCandleAuthor(savedName);
    setShowCandleModal(true);
  };

  const handleCandleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candleMember) return;
    if (!candleAuthor.trim() || !candleContent.trim()) return;

    // Save author name to localStorage
    localStorage.setItem('gia_pha_saved_author_name', candleAuthor.trim());
    setAuthorName(candleAuthor.trim()); // Sync with main form

    // Light the candle
    onToggleCandle(candleMember.id);

    // Save the tribute
    onAddTribute({
      memberId: candleMember.id,
      authorName: candleAuthor.trim(),
      content: candleContent.trim(),
    });

    // Close modal & reset
    setShowCandleModal(false);
    setCandleMember(null);
  };

  const handleToggleClick = (m: Member, isLit: boolean) => {
    if (isLit) {
      // Extinguish immediately
      onToggleCandle(m.id);
    } else {
      // Open modal to enter information and tribute
      openCandleModal(m);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    localStorage.setItem('gia_pha_saved_author_name', authorName.trim());
    setCandleAuthor(authorName.trim()); // Sync with candle modal

    onAddTribute({
      memberId: targetId,
      authorName: authorName.trim(),
      content: content.trim(),
    });

    setContent('');
    setTargetId('');
  };

  return (
    <div className="p-6 bg-stone-950 text-stone-100 h-full overflow-y-auto flex flex-col justify-between rounded-2xl min-h-[600px]">
      <div>
        <div className="text-center mb-8">
          <span className="text-xs text-amber-500 uppercase tracking-widest font-bold">Thành Kính Tri Ân Tổ Tiên</span>
          <h2 className="text-2xl font-bold text-amber-100 mt-1 uppercase">PHÒNG TƯỞNG NHỚ GIA TIÊN</h2>
          <p className="text-stone-400 text-xs max-w-xl mx-auto mt-2 font-bold leading-relaxed">
            Nơi con cháu thắp nén tâm hương, bày tỏ tấm lòng hiếu thảo dâng lên chân linh các bậc tiền nhân đã khuất bóng, giữ gìn đạo lý uống nước nhớ nguồn.
          </p>
        </div>

        {/* Deceased list with candle triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto my-6">
          {deceasedMembers.map((m) => {
            const isLit = litCandles[m.id];
            return (
              <div
                key={m.id}
                className={`border rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all duration-500 bg-stone-900/60 ${
                  isLit
                    ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Avatar & Candle frame */}
                <div className="relative flex flex-col items-center justify-center mb-4">
                  {/* Candle flame dynamic graphic */}
                  {isLit && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                      {/* Fire Flame animation */}
                      <div className="w-4 h-8 bg-amber-400 rounded-full blur-[1px] animate-pulse relative shadow-[0_0_20px_rgba(245,158,11,0.8)]">
                        <div className="absolute bottom-1 left-1 w-2 h-4 bg-orange-600 rounded-full" />
                      </div>
                      {/* Candle body */}
                      <div className="w-1.5 h-6 bg-stone-300 border border-stone-400 rounded-t" />
                    </div>
                  )}

                  <div className="w-16 h-16 rounded-full bg-stone-850 border-2 border-stone-700 flex items-center justify-center text-stone-300 text-2xl font-bold relative overflow-hidden">
                    {m.name.split(' ').pop()?.substring(0, 1)}
                    <div className="absolute inset-0 bg-stone-950/20" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-amber-100 text-base">{m.name}</h4>
                  <span className="text-xs text-amber-600 font-bold">{m.title}</span>
                  <p className="text-stone-400 text-xs mt-1 font-bold">
                    Năm sinh: {m.birthYear || 'Chưa rõ'} - Năm mất: {m.deathYear || 'Chưa rõ'}
                  </p>
                  {m.bio && (
                    <p className="text-stone-500 text-[10px] mt-2 italic px-2 font-bold leading-relaxed line-clamp-2">
                      "{m.bio}"
                    </p>
                  )}
                </div>

                <button
                  id={`btn-candle-${m.id}`}
                  onClick={() => handleToggleClick(m, isLit)}
                  className={`mt-4 w-full py-1.5 px-4 rounded-xl text-xs tracking-wider cursor-pointer transition-all duration-300 ${
                    isLit
                      ? 'bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 font-bold'
                  }`}
                >
                  {isLit ? '🕯️ Đang Thắp Nến' : 'Thắp Nến Tri Ân'}
                </button>
              </div>
            );
          })}
        </div>

        {/* --- TRIBUTE GUESTBOOK FORM & PRAYER WALL --- */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-stone-800 pt-10">
          
          {/* Tribute input form */}
          <div className="bg-stone-900/40 border border-stone-800 p-6 rounded-2xl">
            <h3 className="text-amber-100 font-bold text-base mb-4 uppercase tracking-wider">Viết Lời Tri Ân & Chúc Nguyện</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Họ Tên Con Cháu *</label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Nghiêm Đình Tuấn (Đời 4)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-sm text-stone-100 placeholder-stone-600 focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Dâng Lên Chân Linh Cụ/Ông/Bà</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-sm text-stone-100 focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold"
                >
                  <option value="">Kính lạy chư vị gia tiên tổ đường (Gửi chung)</option>
                  {deceasedMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Lời Tri Ân / Tưởng Niệm *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Kính dâng nén tâm hương, nguyện cầu hương hồn tổ tiên được siêu sinh tịnh độ, độ trì bảo hộ cho gia tộc luôn bình an, thịnh vượng..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-sm text-stone-100 placeholder-stone-600 focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition shadow-md"
              >
                Dâng Lời Chúc Nguyện
              </button>
            </form>
          </div>

          {/* Tribute Wall (Guestbook postings list) */}
          <div className="flex flex-col">
            <h3 className="text-amber-100 font-bold text-base mb-4 uppercase tracking-wider">Bức Tường Lưu Niệm Gia Tộc</h3>
            <div className="flex-grow overflow-y-auto max-h-[360px] space-y-4 pr-2 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
              {tributes.map((tr) => {
                const targetMember = members.find((m) => m.id === tr.memberId);
                return (
                  <div key={tr.id} className="bg-stone-900/60 border border-stone-800/80 p-4 rounded-xl relative">
                    <span className="absolute top-3 right-3 text-[10px] text-stone-500 font-bold">
                      {new Date(tr.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="mb-2">
                      <span className="text-amber-300 font-bold text-xs block">{tr.authorName}</span>
                      {targetMember ? (
                        <span className="text-[10px] text-stone-400 font-bold italic">
                          Dâng lên cụ: {targetMember.name} ({targetMember.title})
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-bold italic">Gửi chư vị Tổ Tiên dòng họ</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed font-bold">"{tr.content}"</p>
                  </div>
                );
              })}

              {tributes.length === 0 && (
                <div className="text-center py-10 text-stone-600 font-bold text-sm">
                  Chưa có lời chúc nguyện nào được gửi lên. Hãy dâng lời đầu tiên!
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Incense virtual smokes for ritual */}
      <div className="border-t border-stone-900 pt-6 mt-10 text-center text-xs text-stone-400 flex flex-col items-center gap-2 font-bold">
        <div className="flex gap-1 justify-center">
          <div className="w-1 h-6 bg-gradient-to-t from-stone-800 to-transparent blur-[1px] animate-pulse" />
          <div className="w-1 h-12 bg-gradient-to-t from-stone-800 to-transparent blur-[1px] animate-pulse delay-75" />
          <div className="w-1 h-8 bg-gradient-to-t from-stone-800 to-transparent blur-[1px] animate-pulse delay-150" />
        </div>
        <span>Hương trầm phảng phất khói sương bay • Lòng thành dâng kính cụ đời đời</span>
      </div>

      {/* --- LIGHT CANDLE MODAL --- */}
      {showCandleModal && candleMember && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl max-w-md w-full text-stone-100 flex flex-col gap-4 relative animate-scale-up">
            <button
              onClick={() => {
                setShowCandleModal(false);
                setCandleMember(null);
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 transition text-lg font-bold"
            >
              ✕
            </button>

            <div className="text-center pb-2 border-b border-stone-800">
              <span className="text-amber-500 text-3xl block animate-pulse">🕯️</span>
              <h3 className="text-amber-100 font-bold text-lg uppercase tracking-wider mt-2">Thắp Nến Tâm Hương Tri Ân</h3>
              <p className="text-xs text-stone-400 font-bold mt-1">
                Kính dâng lên hương hồn: <span className="text-amber-300 font-black">{candleMember.name}</span> ({candleMember.title || 'Thành viên'})
              </p>
            </div>

            <form onSubmit={handleCandleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Họ Tên Con Cháu Thắp Nến *</label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Nghiêm Đình Tuấn (Đời 4)"
                  value={candleAuthor}
                  onChange={(e) => setCandleAuthor(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-sm text-stone-100 placeholder-stone-600 focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Lời Tri Ân / Lời Khấn Nguyện *</label>
                <textarea
                  required
                  rows={4}
                  value={candleContent}
                  onChange={(e) => setCandleContent(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-sm text-stone-100 placeholder-stone-600 focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold leading-relaxed"
                />
              </div>

              {/* Quick Prayer Suggestions */}
              <div>
                <span className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Mẫu lời khấn nguyện nhanh:</span>
                <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {[
                    "Thành tâm kính dâng hương hoa lễ vật, bày tỏ lòng biết ơn sâu sắc đối với công ơn sinh thành dưỡng dục của tiền nhân. Kính cầu hương linh cụ đắc đạo siêu sinh tịnh độ.",
                    "Kính dâng nén tâm hương thành kính tri ân công đức cụ cao dày. Cầu xin cụ anh linh hiển hách, phù hộ độ trì cho gia đình con cháu luôn mạnh khỏe, bình an, hưng vượng.",
                    "Chắp tay kính dâng một nén tâm nhang dâng lên hương hồn cụ. Đời đời khắc ghi công lao tiên tổ, nguyện sống hiếu nghĩa và giữ gìn gia phong nề nếp gia tộc."
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCandleContent(`Kính dâng nén tâm hương, thành tâm tưởng niệm và tri ân sâu sắc công đức cao dày của Cụ/Ông/Bà ${candleMember.name}. ${tpl}`)}
                      className="text-left bg-stone-950 hover:bg-stone-800 border border-stone-850 p-2 rounded-lg text-[10px] text-stone-300 font-medium transition leading-normal block cursor-pointer"
                    >
                      Mẫu {i + 1}: "{tpl.substring(0, 75)}..."
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCandleModal(false);
                    setCandleMember(null);
                  }}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  🕯️ Thắp Nến Tri Ân
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
