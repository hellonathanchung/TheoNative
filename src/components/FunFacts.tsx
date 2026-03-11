import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, PanResponder, Dimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../theme';

const FACTS = [
  { emoji: '\uD83D\uDC76', text: 'Babies can recognize their mother\'s voice from inside the womb.', source: 'DeCasper & Fifer, Science, 1980' },
  { emoji: '\uD83D\uDCAA', text: 'The uterus is the strongest muscle in the human body by weight.', source: 'Cunningham et al., Williams Obstetrics, 26th Ed.' },
  { emoji: '\uD83C\uDF0A', text: 'Contractions work like ocean waves \u2014 they build, peak, and recede.', source: 'ACOG Patient Education' },
  { emoji: '\uD83E\uDDD2', text: 'Newborns can see about 8\u201312 inches \u2014 just far enough to see your face while being held.', source: 'Slater & Johnson, Infant Vision, Oxford, 1998' },
  { emoji: '\u2764\uFE0F', text: 'A baby\'s heart beats about 120\u2013160 times per minute \u2014 roughly twice as fast as yours.', source: 'AAP NRP Guidelines' },
  { emoji: '\uD83E\uDD0F', text: 'Babies are born with about 300 bones. Some fuse together, leaving adults with just 206.', source: 'Gray\'s Anatomy, 42nd Ed.' },
  { emoji: '\uD83D\uDC43', text: 'Newborns can recognize their mother\'s scent right after birth.', source: 'Macfarlane, Ciba Foundation Symposium, 1975' },
  { emoji: '\uD83E\uDEE7', text: 'Babies practice breathing in the womb by inhaling and exhaling amniotic fluid.', source: 'Moore et al., The Developing Human, 11th Ed.' },
  { emoji: '\uD83C\uDF19', text: 'Most babies are born between midnight and 6 AM. Night owls from the start!', source: 'Linde et al., Annals of Epidemiology, 2001' },
  { emoji: '\uD83C\uDFB5', text: 'Babies can hear and remember music played during the third trimester.', source: 'Partanen et al., PLOS ONE, 2013' },
  { emoji: '\uD83D\uDE0A', text: 'Laughing during labor can help release endorphins \u2014 natural painkillers.', source: 'Dunbar et al., Proc. Royal Society B, 2012' },
  { emoji: '\uD83E\uDDE0', text: 'A newborn\'s brain is about 25% of its adult size and doubles in the first year.', source: 'Knickmeyer et al., J. Neuroscience, 2008' },
  { emoji: '\u2728', text: 'The hormone oxytocin that drives contractions is the same "love hormone" released during hugs.', source: 'Uvnas-Moberg, The Oxytocin Factor, 2003' },
  { emoji: '\uD83D\uDC63', text: 'Every baby is born with unique fingerprints \u2014 they develop around 3 months in the womb.', source: 'Kucken & Newell, J. Theoretical Biology, 2005' },
  { emoji: '\uD83C\uDF31', text: 'Babies can taste what their mother eats! Flavors pass through to amniotic fluid.', source: 'Mennella et al., Pediatrics, 2001' },
  { emoji: '\uD83D\uDE34', text: 'Newborns sleep 14\u201317 hours a day, but rarely more than 2\u20133 hours at a stretch.', source: 'Hirshkowitz et al., Sleep Health, 2015' },
  { emoji: '\uD83D\uDC41\uFE0F', text: 'Most babies are born with blue or grey eyes. Permanent color can take up to a year.', source: 'Sturm & Larsson, Experimental Dermatology, 2009' },
  { emoji: '\uD83E\uDD1D', text: 'A baby\'s grip is strong enough to support their own body weight!', source: 'AAP Pediatrics, Palmar Reflex' },
  { emoji: '\uD83E\uDEC1', text: 'Deep, slow breathing during contractions helps deliver more oxygen to your baby.', source: 'Lothian, J. Perinatal Education, 2011' },
  { emoji: '\uD83C\uDF0D', text: 'About 385,000 babies are born every day worldwide.', source: 'UNICEF, State of the World\'s Children, 2023' },
  { emoji: '\uD83E\uDDB7', text: 'Baby teeth start forming in the womb \u2014 they\'re hidden under the gums at birth.', source: 'AAPD Perinatal Oral Health Guideline' },
  { emoji: '\uD83E\uDDEC', text: 'Your baby has their own unique DNA from the moment of conception.', source: 'Alberts et al., Molecular Biology of the Cell, 7th Ed.' },
  { emoji: '\uD83D\uDCA4', text: 'Between contractions is the perfect time to rest. Even a few seconds helps.', source: 'Simkin, The Birth Partner, 5th Ed.' },
  { emoji: '\uD83C\uDF88', text: 'Babies can hiccup in the womb! Those rhythmic bumps you felt were hiccups.', source: 'Whitehead et al., Clinical Neurophysiology, 2019' },
  { emoji: '\uD83C\uDF38', text: 'Every contraction is a step closer to meeting your baby. You\'re doing incredible work.', source: 'Gaskin, Ina May\'s Guide to Childbirth, 2003' },
  { emoji: '\uD83D\uDC18', text: 'Human pregnancy is 9 months, but elephants carry their babies for 22 months!', source: 'Lueders et al., Proc. Royal Society B, 2012' },
  { emoji: '\uD83E\uDD98', text: 'Kangaroo babies are born the size of a jellybean and crawl into mom\'s pouch.', source: 'Tyndale-Biscoe, Life of Marsupials, CSIRO, 2005' },
  { emoji: '\uD83C\uDFCA', text: 'Babies instinctively hold their breath underwater for a few months after birth.', source: 'Goksor et al., Acta Paediatrica, 2002' },
  { emoji: '\uD83D\uDE02', text: 'Babies start smiling socially around 6\u20138 weeks. That first real smile is worth everything.', source: 'Messinger & Fogel, Child Development, 2007' },
  { emoji: '\uD83C\uDFA4', text: 'Babies babble in the rhythm of their native language before they can speak.', source: 'de Boysson-Bardies et al., J. Child Language, 1984' },
];

export function FunFacts() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [fading, setFading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [shared, setShared] = useState(false);

  const nextFact = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % FACTS.length);
      setFading(false);
    }, 300);
  }, []);

  const prevFact = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + FACTS.length) % FACTS.length);
      setFading(false);
    }, 300);
  }, []);

  const shareFact = useCallback(async () => {
    const fact = FACTS[index];
    const text = `${fact.emoji} ${fact.text}\n\nSource: ${fact.source}\n\n\u2014 from Theo, a contraction timer app`;
    await Clipboard.setStringAsync(text);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [index]);

  // Swipe handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 20,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) nextFact();
        else if (gestureState.dx > 40) prevFact();
      },
    })
  ).current;

  // Auto-rotate
  useEffect(() => {
    if (collapsed) return;
    const interval = setInterval(nextFact, 12000);
    return () => clearInterval(interval);
  }, [nextFact, collapsed]);

  const fact = FACTS[index];

  return (
    <View style={s.container}>
      <Pressable onPress={() => setCollapsed(!collapsed)} style={s.headerRow}>
        <Text style={s.headerLabel}>DID YOU KNOW?</Text>
        <Text style={[s.chevron, collapsed && { transform: [{ rotate: '-90deg' }] }]}>
          {'\u25BE'}
        </Text>
      </Pressable>

      {!collapsed && (
        <>
          <View style={s.navRow}>
            <Pressable onPress={prevFact}>
              <Text style={s.navBtn}>{'\u2190'} Prev</Text>
            </Pressable>
            <Pressable onPress={shareFact} style={s.shareBtn}>
              <Text style={s.shareBtnText}>{shared ? '\u2713 Copied!' : '\u2197 Share'}</Text>
            </Pressable>
            <Pressable onPress={nextFact}>
              <Text style={s.navBtn}>Next {'\u2192'}</Text>
            </Pressable>
          </View>

          <View
            {...panResponder.panHandlers}
            style={[s.card, { opacity: fading ? 0 : 1 }]}
          >
            <Text style={s.emoji}>{fact.emoji}</Text>
            <Text style={s.factText}>{fact.text}</Text>
            <Text style={s.sourceText}>{fact.source}</Text>
          </View>

          <View style={s.dotsRow}>
            {Array.from({ length: Math.min(5, FACTS.length) }, (_, i) => {
              const dotIdx = (Math.floor(index / 5) * 5 + i) % FACTS.length;
              return (
                <View
                  key={i}
                  style={[
                    s.dot,
                    { backgroundColor: dotIdx === index ? Colors.terracotta : Colors.beige },
                  ]}
                />
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingVertical: 6 },
  headerLabel: { fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5 },
  chevron: { fontSize: 14, color: Colors.textMuted },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navBtn: { fontSize: 12, color: Colors.terracotta, fontWeight: '500' },
  shareBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, backgroundColor: Colors.beige },
  shareBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  card: { backgroundColor: Colors.beige, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  emoji: { fontSize: 28, marginBottom: 8 },
  factText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center', maxWidth: 280 },
  sourceText: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4, textAlign: 'center', maxWidth: 260, lineHeight: 16 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
