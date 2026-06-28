import React, { useState, useRef, useEffect } from 'react';
import { Member } from '../types';
import { getYearFromStr, calculateAgeInfo } from '../utils/lunar';

interface FamilyTreeCanvasProps {
  members: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
  litCandles: Record<string, boolean>;
}

export default function FamilyTreeCanvas({
  members,
  selectedId,
  onSelect,
  litCandles,
}: FamilyTreeCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Drag & Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.member-card') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1.6));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleFactor = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;
    setZoom((prev) => {
      const next = prev + direction * scaleFactor;
      return Math.min(Math.max(next, 0.4), 1.8);
    });
  };

  // Helper: Find a member by ID
  const findMember = (id: string) => members.find((m) => m.id === id);

  return (
    <div
      ref={containerRef}
      className="flex-grow flex flex-col relative bg-stone-100 select-none overflow-hidden min-h-[600px] h-full rounded-2xl print:bg-white print:overflow-visible print:min-h-0"
    >
      {/* Control Tools overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-stone-300 p-2 rounded-xl shadow-lg flex items-center space-x-2 print:hidden">
        <button
          id="btn-zoom-in"
          onClick={zoomIn}
          className="p-2 hover:bg-stone-100 rounded-lg text-stone-700 font-bold transition cursor-pointer"
          title="Phóng To"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          id="btn-zoom-out"
          onClick={zoomOut}
          className="p-2 hover:bg-stone-100 rounded-lg text-stone-700 font-bold transition cursor-pointer"
          title="Thu Nhỏ"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          id="btn-zoom-reset"
          onClick={resetZoom}
          className="p-2 hover:bg-stone-100 rounded-lg text-stone-700 font-bold transition cursor-pointer text-xs"
          title="Khôi Phục"
        >
          Khôi Phục
        </button>
        <div className="h-5 w-px bg-stone-300 mx-1" />
        <span className="text-xs font-bold text-stone-500">Thu phóng: {Math.round(zoom * 100)}%</span>
      </div>

      {/* Guide Instruction Overlay */}
      <div className="absolute top-4 right-4 z-10 bg-stone-900/80 text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 print:hidden">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-bold">Kéo chuột/Cuộn con lăn để di chuyển phả hệ • Click chọn thành viên</span>
      </div>

      {/* Canvas Area */}
      <div
        id="family-tree-canvas-area"
        className="flex-grow cursor-grab active:cursor-grabbing overflow-hidden relative flex items-center justify-center print:overflow-visible print:block print:bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute transition-transform duration-75 origin-center ease-out print:relative print:transform-none print:top-0 print:left-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Main vertical tree stack */}
          <div className="flex flex-col items-center gap-16 py-10 px-20 print:p-0 print:gap-12">
            
            {/* --- GENERATION 1 --- */}
            <div className="flex flex-col items-center">
              <div className="text-stone-400 uppercase tracking-widest text-xs font-bold mb-4 bg-stone-200 px-3 py-1 rounded-full border border-stone-300 print:border-black print:text-black print:bg-white print:mb-2">
                THẾ HỆ I (THỦY TỔ)
              </div>
              <div className="flex justify-center">
                <div className="relative flex items-center bg-stone-200/50 p-4 rounded-3xl border border-stone-300/80 shadow-md print:bg-white print:border-black print:p-2">
                  <MemberNodeCard
                    member={findMember("g1-p1")}
                    isSelected={selectedId === "g1-p1"}
                    onSelect={onSelect}
                    lit={litCandles["g1-p1"]}
                  />
                  {/* Husband & Wife Connect Line */}
                  <div className="w-8 h-0.5 bg-gradient-to-r from-rose-950 to-amber-700 flex items-center justify-center relative print:bg-black">
                    <svg
                      className="w-4 h-4 text-rose-800 absolute -top-1.5 print:text-black"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <MemberNodeCard
                    member={findMember("g1-p2")}
                    isSelected={selectedId === "g1-p2"}
                    onSelect={onSelect}
                    lit={litCandles["g1-p2"]}
                  />
                </div>
              </div>
            </div>

            {/* Gen 1 to Gen 2 Vertical Connector */}
            <div className="w-full h-1 bg-stone-400 max-w-4xl relative -my-8 print:bg-black print:my-0">
              <div className="absolute left-1/2 -top-8 h-8 w-0.5 bg-stone-400 -translate-x-1/2 print:bg-black print:-top-6 print:h-6" />
              <div className="absolute left-1/6 h-8 w-0.5 bg-stone-400 print:bg-black print:h-6" />
              <div className="absolute left-1/2 h-8 w-0.5 bg-stone-400 print:bg-black print:h-6" />
              <div className="absolute right-1/6 h-8 w-0.5 bg-stone-400 print:bg-black print:h-6" />
            </div>

            {/* --- GENERATION 2 --- */}
            <div className="flex flex-col items-center">
              <div className="text-stone-400 uppercase tracking-widest text-xs font-bold mb-4 bg-stone-200 px-3 py-1 rounded-full border border-stone-300 print:border-black print:text-black print:bg-white print:mb-2">
                THẾ HỆ II (CÁC CHI NGÀNH)
              </div>
              <div className="flex justify-center gap-8 sm:gap-12 print:gap-4">
                
                {/* Chi Cả Trưởng */}
                <div className="flex flex-col items-center border-r border-dashed border-stone-300 pr-6 sm:pr-8 print:border-black print:pr-2">
                  <span className="text-amber-900 font-bold text-xs mb-2 print:text-black">CHI TRƯỞNG CẢ</span>
                  <div className="flex items-center bg-stone-200/50 p-3 rounded-3xl border border-stone-300/80 print:bg-white print:border-black print:p-1">
                    <MemberNodeCard
                      member={findMember("g2-p1")}
                      isSelected={selectedId === "g2-p1"}
                      onSelect={onSelect}
                      lit={litCandles["g2-p1"]}
                    />
                    <div className="w-4 sm:w-6 h-0.5 bg-rose-900 print:bg-black" />
                    <MemberNodeCard
                      member={findMember("g2-p2")}
                      isSelected={selectedId === "g2-p2"}
                      onSelect={onSelect}
                      lit={litCandles["g2-p2"]}
                    />
                  </div>
                  {/* Conector xuống đời F3 */}
                  <div className="h-8 w-0.5 bg-stone-400 my-2 print:bg-black print:h-6" />
                </div>

                {/* Chi Thứ */}
                <div className="flex flex-col items-center border-r border-dashed border-stone-300 pr-6 sm:pr-8 print:border-black print:pr-2">
                  <span className="text-amber-900 font-bold text-xs mb-2 print:text-black">CHI THỨ HAI</span>
                  <div className="flex items-center bg-stone-200/50 p-3 rounded-3xl border border-stone-300/80 print:bg-white print:border-black print:p-1">
                    <MemberNodeCard
                      member={findMember("g2-p3")}
                      isSelected={selectedId === "g2-p3"}
                      onSelect={onSelect}
                      lit={litCandles["g2-p3"]}
                    />
                    <div className="w-4 sm:w-6 h-0.5 bg-rose-900 print:bg-black" />
                    <MemberNodeCard
                      member={findMember("g2-p4")}
                      isSelected={selectedId === "g2-p4"}
                      onSelect={onSelect}
                      lit={litCandles["g2-p4"]}
                    />
                  </div>
                  {/* Conector xuống đời F3 */}
                  <div className="h-8 w-0.5 bg-stone-400 my-2 print:bg-black print:h-6" />
                </div>

                {/* Chi Cô Út */}
                <div className="flex flex-col items-center">
                  <span className="text-amber-900 font-bold text-xs mb-2 print:text-black">CHI CÔ ÚT</span>
                  <div className="flex items-center bg-stone-200/50 p-3 rounded-3xl border border-stone-300/80 print:bg-white print:border-black print:p-1">
                    <MemberNodeCard
                      member={findMember("g2-p5")}
                      isSelected={selectedId === "g2-p5"}
                      onSelect={onSelect}
                      lit={litCandles["g2-p5"]}
                    />
                    <div className="w-4 sm:w-6 h-0.5 bg-rose-900 print:bg-black" />
                    <MemberNodeCard
                      member={findMember("g2-p6")}
                      isSelected={selectedId === "g2-p6"}
                      onSelect={onSelect}
                      lit={litCandles["g2-p6"]}
                    />
                  </div>
                  {/* Chi Cô Út không có hậu duệ sinh con trực hệ trong sơ đồ mẫu */}
                  <div className="h-8 w-0.5 bg-transparent my-2 print:h-6" />
                </div>

              </div>
            </div>

            {/* --- GENERATION 3 --- */}
            <div className="flex flex-col items-center">
              <div className="text-stone-400 uppercase tracking-widest text-xs font-bold mb-4 bg-stone-200 px-3 py-1 rounded-full border border-stone-300 print:border-black print:text-black print:bg-white print:mb-2">
                THẾ HỆ III (ĐỜI CON)
              </div>
              <div className="flex justify-center gap-8 print:gap-4">
                
                {/* Nhóm con của Chi Cả */}
                <div className="flex justify-center gap-4 sm:gap-6 border-r border-dashed border-stone-300 pr-4 sm:pr-6 print:border-black print:pr-2">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center bg-rose-50/50 p-3 rounded-3xl border border-rose-100 shadow-sm print:bg-white print:border-black print:p-1">
                      <MemberNodeCard
                        member={findMember("g3-p1")}
                        isSelected={selectedId === "g3-p1"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p1"]}
                      />
                      <div className="w-4 sm:w-6 h-0.5 bg-rose-800 print:bg-black" />
                      <MemberNodeCard
                        member={findMember("g3-p2")}
                        isSelected={selectedId === "g3-p2"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p2"]}
                      />
                    </div>
                    <div className="h-8 w-0.5 bg-stone-400 my-2 print:bg-black print:h-6" />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center bg-rose-50/50 p-3 rounded-3xl border border-rose-100 shadow-sm print:bg-white print:border-black print:p-1">
                      <MemberNodeCard
                        member={findMember("g3-p3")}
                        isSelected={selectedId === "g3-p3"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p3"]}
                      />
                      <div className="w-4 sm:w-6 h-0.5 bg-rose-800 print:bg-black" />
                      <MemberNodeCard
                        member={findMember("g3-p4")}
                        isSelected={selectedId === "g3-p4"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p4"]}
                      />
                    </div>
                    <div className="h-8 w-0.5 bg-stone-400 my-2 print:bg-black print:h-6" />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center bg-rose-50/50 p-3 rounded-3xl border border-rose-100 shadow-sm print:bg-white print:border-black print:p-1">
                      <MemberNodeCard
                        member={findMember("g3-p5")}
                        isSelected={selectedId === "g3-p5"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p5"]}
                      />
                      <div className="w-4 sm:w-6 h-0.5 bg-rose-800 print:bg-black" />
                      <MemberNodeCard
                        member={findMember("g3-p6")}
                        isSelected={selectedId === "g3-p6"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p6"]}
                      />
                    </div>
                    <div className="h-8 w-0.5 bg-stone-400 my-2 print:bg-black print:h-6" />
                  </div>
                </div>

                {/* Nhóm con của Chi Thứ */}
                <div className="flex justify-center gap-4 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center bg-stone-200/40 p-3 rounded-3xl border border-stone-300 print:bg-white print:border-black print:p-1">
                      <MemberNodeCard
                        member={findMember("g3-p7")}
                        isSelected={selectedId === "g3-p7"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p7"]}
                      />
                      <div className="w-4 sm:w-6 h-0.5 bg-stone-500 print:bg-black" />
                      <MemberNodeCard
                        member={findMember("g3-p8")}
                        isSelected={selectedId === "g3-p8"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p8"]}
                      />
                    </div>
                    <div className="h-8 w-0.5 bg-stone-400 my-2 print:bg-black print:h-6" />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center bg-stone-200/40 p-3 rounded-3xl border border-stone-300 print:bg-white print:border-black print:p-1">
                      <MemberNodeCard
                        member={findMember("g3-p9")}
                        isSelected={selectedId === "g3-p9"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p9"]}
                      />
                      <div className="w-4 sm:w-6 h-0.5 bg-stone-500 print:bg-black" />
                      <MemberNodeCard
                        member={findMember("g3-p10")}
                        isSelected={selectedId === "g3-p10"}
                        onSelect={onSelect}
                        lit={litCandles["g3-p10"]}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* --- GENERATION 4 --- */}
            <div className="flex flex-col items-center">
              <div className="text-stone-400 uppercase tracking-widest text-xs font-bold mb-4 bg-stone-200 px-3 py-1 rounded-full border border-stone-300 print:border-black print:text-black print:bg-white print:mb-2">
                THẾ HỆ IV (ĐỜI CHÁU CHẮT)
              </div>
              <div className="flex justify-center gap-6 sm:gap-8 print:gap-4">
                
                {/* Con của g3-p1 Mạnh */}
                <div className="flex flex-col items-center border-r border-dashed border-stone-300 pr-4 sm:pr-6 print:border-black print:pr-2">
                  <div className="flex gap-4 print:gap-2">
                    <div className="flex items-center bg-amber-50/60 p-2.5 rounded-3xl border border-amber-200 shadow-sm print:bg-white print:border-black print:p-1">
                      <MemberNodeCard
                        member={findMember("g4-p1")}
                        isSelected={selectedId === "g4-p1"}
                        onSelect={onSelect}
                        lit={litCandles["g4-p1"]}
                      />
                      <div className="w-3 sm:w-5 h-0.5 bg-amber-600 print:bg-black" />
                      <MemberNodeCard
                        member={findMember("g4-p2")}
                        isSelected={selectedId === "g4-p2"}
                        onSelect={onSelect}
                        lit={litCandles["g4-p2"]}
                      />
                    </div>
                    <div className="flex items-center bg-amber-50/60 p-2.5 rounded-3xl border border-amber-200 shadow-sm print:bg-white print:border-black print:p-1">
                      <MemberNodeCard
                        member={findMember("g4-p3")}
                        isSelected={selectedId === "g4-p3"}
                        onSelect={onSelect}
                        lit={litCandles["g4-p3"]}
                      />
                      <div className="w-3 sm:w-5 h-0.5 bg-amber-600 print:bg-black" />
                      <MemberNodeCard
                        member={findMember("g4-p4")}
                        isSelected={selectedId === "g4-p4"}
                        onSelect={onSelect}
                        lit={litCandles["g4-p4"]}
                      />
                    </div>
                  </div>
                </div>

                {/* Con của g3-p3 Bình */}
                <div className="flex flex-col items-center border-r border-dashed border-stone-300 pr-4 sm:pr-6 print:border-black print:pr-2">
                  <div className="flex items-center bg-amber-50/60 p-2.5 rounded-3xl border border-amber-200 shadow-sm print:bg-white print:border-black print:p-1">
                    <MemberNodeCard
                      member={findMember("g4-p5")}
                      isSelected={selectedId === "g4-p5"}
                      onSelect={onSelect}
                      lit={litCandles["g4-p5"]}
                    />
                    <div className="w-3 sm:w-5 h-0.5 bg-amber-600 print:bg-black" />
                    <MemberNodeCard
                      member={findMember("g4-p6")}
                      isSelected={selectedId === "g4-p6"}
                      onSelect={onSelect}
                      lit={litCandles["g4-p6"]}
                    />
                  </div>
                </div>

                {/* Con của g3-p5 Hải */}
                <div className="flex flex-col items-center border-r border-dashed border-stone-300 pr-4 sm:pr-6 print:border-black print:pr-2">
                  <MemberNodeCard
                    member={findMember("g4-p7")}
                    isSelected={selectedId === "g4-p7"}
                    onSelect={onSelect}
                    lit={litCandles["g4-p7"]}
                  />
                </div>

                {/* Con của g3-p7 Minh */}
                <div className="flex flex-col items-center">
                  <div className="flex gap-4 print:gap-2">
                    <div className="flex items-center bg-stone-200/50 p-2.5 rounded-3xl border border-stone-300 print:bg-white print:border-black print:p-1">
                      <MemberNodeCard
                        member={findMember("g4-p8")}
                        isSelected={selectedId === "g4-p8"}
                        onSelect={onSelect}
                        lit={litCandles["g4-p8"]}
                      />
                      <div className="w-3 sm:w-5 h-0.5 bg-stone-500 print:bg-black" />
                      <MemberNodeCard
                        member={findMember("g4-p9")}
                        isSelected={selectedId === "g4-p9"}
                        onSelect={onSelect}
                        lit={litCandles["g4-p9"]}
                      />
                    </div>
                    <MemberNodeCard
                      member={findMember("g4-p10")}
                      isSelected={selectedId === "g4-p10"}
                      onSelect={onSelect}
                      lit={litCandles["g4-p10"]}
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: REUSABLE MEMBER CARD NODE ---
interface MemberNodeCardProps {
  member: Member | undefined;
  isSelected: boolean;
  onSelect: (id: string) => void;
  lit?: boolean;
}

function MemberNodeCard({ member, isSelected, onSelect, lit }: MemberNodeCardProps) {
  if (!member) return null;

  return (
    <div
      onClick={() => onSelect(member.id)}
      className={`member-card w-36 sm:w-40 shrink-0 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative print:border-stone-800 print:bg-white print:text-black print:break-inside-avoid print:w-32 print:p-2 ${
        isSelected
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.25)] scale-105 z-10 print:border-black print:shadow-none print:scale-100'
          : member.gender === 'male'
          ? 'bg-white hover:bg-sky-50/50 border-sky-100 hover:border-sky-300 shadow-sm print:border-stone-800'
          : 'bg-white hover:bg-rose-50/50 border-rose-100 hover:border-rose-300 shadow-sm print:border-stone-800'
      }`}
    >
      {/* Candle Flame animation indicator overlay */}
      {lit && member.isDeceased && (
        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[8px] px-1 rounded-full animate-pulse shadow font-bold print:hidden">
          🕯️ Nến Sáng
        </span>
      )}

      {/* Avatar node layout */}
      <div className="flex items-center space-x-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold print:border print:border-stone-800 print:bg-white print:text-black ${
            member.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
          } shrink-0 overflow-hidden relative`}
        >
          {member.name.split(' ').pop()?.substring(0, 1)}
          {member.isDeceased && (
            <div className="absolute inset-0 bg-stone-950/45 print:bg-transparent print:text-black flex items-center justify-center text-[8px] text-amber-200">
              ✝
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h4 className="text-xs font-black text-stone-900 print:text-black truncate">
            {member.name}
          </h4>
          <span className="text-[10px] text-stone-500 print:text-stone-800 font-bold truncate block">
            {member.title || 'Thành viên'}
          </span>
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-stone-100 print:border-stone-800 flex items-center justify-between text-[10px] text-stone-400 print:text-stone-800 font-bold">
        <span>Đời F{member.generation}</span>
        <span className="text-stone-500 print:text-stone-800">
          {getYearFromStr(member.birthYear) || '?'}-{member.isDeceased ? getYearFromStr(member.deathYear) || '✝' : 'Nay'}
          {calculateAgeInfo(member.birthYear, member.deathYear, member.isDeceased).hasAge && (
            ` (${calculateAgeInfo(member.birthYear, member.deathYear, member.isDeceased).age}t)`
          )}
        </span>
      </div>
    </div>
  );
}
