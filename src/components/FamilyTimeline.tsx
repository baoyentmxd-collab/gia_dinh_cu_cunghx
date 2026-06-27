import React, { useMemo } from 'react';
import { Member } from '../types';
import { getYearFromStr } from '../utils/lunar';

interface FamilyTimelineProps {
  members: Member[];
  onSelectMember: (id: string) => void;
}

interface TimelineEvent {
  year: number;
  member: Member;
  type: 'birth' | 'death';
  text: string;
}

export default function FamilyTimeline({ members, onSelectMember }: FamilyTimelineProps) {
  // Timeline events sorting chronologically
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    members.forEach((m) => {
      const bYear = getYearFromStr(m.birthYear);
      if (bYear) {
        events.push({
          year: bYear,
          member: m,
          type: 'birth',
          text: `Cụ/Ông/Bà/Anh/Chị ${m.name} (${m.title || 'Thành viên'}) cất tiếng khóc chào đời tại ${m.birthPlace || 'Hà Nội'}.`,
        });
      }
      const dYear = m.isDeceased ? getYearFromStr(m.deathYear) : 0;
      if (m.isDeceased && dYear) {
        events.push({
          year: dYear,
          member: m,
          type: 'death',
          text: `Cụ/Ông/Bà ${m.name} tạ thế về cõi vĩnh hằng, an táng và yên nghỉ tại ${m.restingPlace || 'Nghĩa trang dòng họ'}.`,
        });
      }
    });
    return events.sort((a, b) => a.year - b.year);
  }, [members]);

  return (
    <div className="p-6 overflow-y-auto max-h-[700px]">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-rose-950 uppercase tracking-wider">BIÊN NIÊN SỬ GIA TỘC NGHIÊM GIA</h2>
        <p className="text-xs text-stone-500 mt-1 font-bold">Lịch trình ghi nhận ngày sinh, ngày tạ thế của các thành viên được cập nhật tự động</p>
      </div>

      {/* Vertical timeline layout */}
      <div className="relative border-l-2 border-amber-600/40 ml-4 md:ml-32 py-4 space-y-8">
        {timelineEvents.map((ev, index) => (
          <div key={index} className="relative group">
            
            {/* Date badge */}
            <div className="absolute -left-[5.5rem] md:-left-[9rem] top-1.5 bg-rose-950 text-amber-100 text-xs font-bold px-3 py-1 rounded-lg border border-amber-500 shadow-md">
              Năm {ev.year}
            </div>

            {/* Node Dot icon */}
            <div className={`absolute -left-2.5 top-2.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow ${
              ev.type === 'birth' ? 'bg-emerald-500' : 'bg-stone-600'
            }`}>
              <span className="text-[9px] text-white font-bold">{ev.type === 'birth' ? '★' : '✝'}</span>
            </div>

            {/* Timeline Event Card */}
            <div className="ml-6 md:ml-10 bg-stone-50 border border-stone-200 hover:border-amber-300 p-4 rounded-xl shadow-sm hover:shadow transition duration-200">
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  {ev.member.name}
                  <span className="text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">{ev.member.title}</span>
                </h4>
                <span className="text-xs text-stone-400 font-bold">Thế Hệ Đời F{ev.member.generation}</span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed font-bold">{ev.text}</p>
              
              {/* Short action */}
              <button
                onClick={() => onSelectMember(ev.member.id)}
                className="text-xs text-rose-900 hover:text-rose-850 font-bold mt-2 inline-flex items-center gap-1 cursor-pointer"
              >
                Xem chi tiết bảo căn →
              </button>
            </div>

          </div>
        ))}

        {timelineEvents.length === 0 && (
          <div className="text-center p-8 text-stone-500 font-bold">
            Chưa có biên niên sử. Hãy cập nhật năm sinh/mất của các thành viên để tự động ghi chép!
          </div>
        )}
      </div>
    </div>
  );
}
