import React, { useMemo } from 'react';
import { Member } from '../types';

interface FamilyStatsProps {
  members: Member[];
  litCandles: Record<string, boolean>;
}

export default function FamilyStats({ members, litCandles }: FamilyStatsProps) {
  // Process stats
  const stats = useMemo(() => {
    const total = members.length;
    const maleCount = members.filter((m) => m.gender === 'male').length;
    const femaleCount = members.filter((m) => m.gender === 'female').length;
    const livingCount = members.filter((m) => !m.isDeceased).length;
    const deceasedCount = total - livingCount;

    // Average lifespan of deceased members
    const deceasedWithAge = members.filter((m) => m.isDeceased && m.birthYear && m.deathYear);
    const averageLifespan =
      deceasedWithAge.length > 0
        ? Math.round(
            deceasedWithAge.reduce(
              (acc, curr) => acc + (parseInt(curr.deathYear) - parseInt(curr.birthYear)),
              0
            ) / deceasedWithAge.length
          )
        : 'Chưa rõ';

    // Count per generation
    const genCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    members.forEach((m) => {
      if (m.generation >= 1 && m.generation <= 4) {
        genCounts[m.generation] = (genCounts[m.generation] || 0) + 1;
      }
    });

    // Birth places density
    const places: Record<string, number> = {};
    members.forEach((m) => {
      if (m.birthPlace) {
        const p = m.birthPlace.split(',').pop()?.trim() || m.birthPlace;
        places[p] = (places[p] || 0) + 1;
      }
    });
    const popularPlaces = Object.entries(places)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total,
      maleCount,
      femaleCount,
      livingCount,
      deceasedCount,
      averageLifespan,
      genCounts,
      popularPlaces,
    };
  }, [members]);

  return (
    <div className="p-6 overflow-y-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-rose-950 uppercase tracking-wider">BÁO CÁO THỐNG KÊ GIA TỘC</h2>
        <p className="text-xs text-stone-500 font-bold">Phân tích chuyên sâu dữ liệu cơ cấu, thế hệ và sự phát triển của dòng họ</p>
      </div>

      {/* Bento Grid Stats Card Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-1">Tuổi Thọ Trung Bình</span>
          <span className="text-2xl font-black text-rose-950 block">{stats.averageLifespan} Tuổi</span>
          <span className="text-[10px] text-stone-500 mt-1 block font-bold">Khảo sát trên các thành viên đã khuất</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-1">Cơ cấu nam / nữ</span>
          <span className="text-2xl font-black text-emerald-950 block">{stats.maleCount} Nam / {stats.femaleCount} Nữ</span>
          <span className="text-[10px] text-stone-500 mt-1 block font-bold">Tỷ lệ: {stats.total > 0 ? Math.round((stats.maleCount / stats.total) * 100) : 0}% Nam và {stats.total > 0 ? Math.round((stats.femaleCount / stats.total) * 100) : 0}% Nữ</span>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">Thế Hệ Phát Triển</span>
          <span className="text-2xl font-black text-blue-950 block">4 Thế Hệ (Đời)</span>
          <span className="text-[10px] text-stone-500 mt-1 block font-bold">Khởi thủy từ thế hệ I (Năm 1895)</span>
        </div>

        <div className="bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-300 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wide block mb-1">Tri Ân & Tưởng Nhớ</span>
          <span className="text-2xl font-black text-stone-950 block">{Object.values(litCandles).filter(Boolean).length} Ngọn nến</span>
          <span className="text-[10px] text-stone-500 mt-1 block font-bold">Nến lấp lánh phòng thờ gia tiên</span>
        </div>

      </div>

      {/* Graphical Chart rows using custom exquisite CSS / SVG layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Chart 1: Members Count per Generation */}
        <div className="border border-stone-200 p-6 rounded-2xl bg-stone-50 shadow-sm">
          <h4 className="font-bold text-stone-800 text-sm mb-4 uppercase tracking-wider">Mật Độ Thành Viên Các Đời (F1 - F4)</h4>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((gen) => {
              const count = stats.genCounts[gen] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const genRoman = gen === 1 ? 'I' : gen === 2 ? 'II' : gen === 3 ? 'III' : 'IV';
              return (
                <div key={gen} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Đời thứ {genRoman} (Thế Hệ {gen})</span>
                    <span className="text-stone-500">{count} thành viên ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full h-3.5 bg-stone-200 rounded-full overflow-hidden border border-stone-300/30">
                    <div
                      className="h-full bg-rose-900 rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Living vs Deceased breakdown */}
        <div className="border border-stone-200 p-6 rounded-2xl bg-stone-50 shadow-sm flex flex-col justify-between">
          <h4 className="font-bold text-stone-800 text-sm mb-4 uppercase tracking-wider">Cơ Cấu Sinh Mệnh Dòng Họ</h4>
          
          <div className="flex items-center justify-around py-4">
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-600">{stats.livingCount}</div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Còn sống</span>
            </div>
            <div className="h-12 w-px bg-stone-300" />
            <div className="text-center">
              <div className="text-2xl font-black text-stone-600">{stats.deceasedCount}</div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Đã tạ thế</span>
            </div>
          </div>

          <div className="w-full h-5 bg-stone-200 rounded-full overflow-hidden flex border border-stone-300/30">
            <div
              className="bg-emerald-500 h-full transition-all duration-1000"
              style={{ width: `${stats.total > 0 ? (stats.livingCount / stats.total) * 100 : 0}%` }}
              title="Còn Sống"
            />
            <div
              className="bg-stone-500 h-full transition-all duration-1000"
              style={{ width: `${stats.total > 0 ? (stats.deceasedCount / stats.total) * 100 : 0}%` }}
              title="Đã Tạ Thế"
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-stone-500 mt-3 font-bold">
            <span>Xanh lục: Đang sinh sống & tòng kính ({stats.total > 0 ? Math.round((stats.livingCount / stats.total) * 100) : 0}%)</span>
            <span>Xám tro: Đã khuất bóng về tiên tổ ({stats.total > 0 ? Math.round((stats.deceasedCount / stats.total) * 100) : 0}%)</span>
          </div>

        </div>

        {/* Chart 3: Popular Birthplaces of Clan members */}
        <div className="border border-stone-200 p-6 rounded-2xl bg-stone-50 shadow-sm md:col-span-2">
          <h4 className="font-bold text-stone-800 text-sm mb-4 uppercase tracking-wider">Phân Bố Địa Lý Quê Quán / Nơi Sinh Phổ Biến</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.popularPlaces.map(([place, count]) => {
              const maxCount = Math.max(...stats.popularPlaces.map(([_, c]) => c));
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={place} className="bg-white border border-stone-200 p-3.5 rounded-xl">
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-stone-800">{place}</span>
                    <span className="text-amber-800">{count} người</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            {stats.popularPlaces.length === 0 && (
              <div className="text-center py-6 text-stone-500 font-bold col-span-2">
                Chưa cập nhật nơi sinh hay quê quán nào.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
