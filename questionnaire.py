from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER

OUTPUT = '/home/ubuntu/.openclaw/workspace/finmike/GrowYourWorld_BuilderQuestionnaire.pdf'

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=letter,
    leftMargin=0.85*inch,
    rightMargin=0.85*inch,
    topMargin=0.85*inch,
    bottomMargin=0.85*inch,
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle('Title', parent=styles['Normal'],
    fontSize=20, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a1a2e'),
    spaceAfter=4, alignment=TA_CENTER)

subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
    fontSize=11, fontName='Helvetica', textColor=colors.HexColor('#555555'),
    spaceAfter=2, alignment=TA_CENTER)

note_style = ParagraphStyle('Note', parent=styles['Normal'],
    fontSize=9, fontName='Helvetica-Oblique', textColor=colors.HexColor('#777777'),
    spaceAfter=16, alignment=TA_CENTER)

section_style = ParagraphStyle('Section', parent=styles['Normal'],
    fontSize=13, fontName='Helvetica-Bold', textColor=colors.HexColor('#ffffff'),
    spaceBefore=14, spaceAfter=6, leftIndent=0)

question_style = ParagraphStyle('Question', parent=styles['Normal'],
    fontSize=10.5, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a1a2e'),
    spaceBefore=10, spaceAfter=3, leftIndent=0)

body_style = ParagraphStyle('Body', parent=styles['Normal'],
    fontSize=10, fontName='Helvetica', textColor=colors.HexColor('#333333'),
    spaceAfter=3, leftIndent=12, leading=14)

answer_style = ParagraphStyle('Answer', parent=styles['Normal'],
    fontSize=10, fontName='Helvetica', textColor=colors.HexColor('#999999'),
    spaceAfter=8, leftIndent=12)

from reportlab.platypus import Table, TableStyle

def section_header(text):
    data = [[Paragraph(text, section_style)]]
    t = Table(data, colWidths=[6.8*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#2d6a4f')),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    return t

def q(num, text):
    return Paragraph(f'{num}. {text}', question_style)

def opt(text):
    return Paragraph(text, body_style)

def answer_line():
    return Paragraph('Answer: _______________________________________________', answer_style)

story = []

# Header
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph('Grow Your World — Builder Questions', title_style))
story.append(Paragraph('For Mike, from Andrew & Smithers', subtitle_style))
story.append(Paragraph('Short answers are totally fine — even "you decide" is helpful. The more you answer, the less we guess.', note_style))
story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#dddddd'), spaceAfter=10))

# --- Section 1 ---
story.append(section_header('🎮  Gameplay Feel'))
story.append(Spacer(1, 4))

story.append(q(1, 'When a kid runs out of Energy mid-day, what should happen?'))
story.append(opt('(a) Day ends automatically and they sleep'))
story.append(opt('(b) They can still explore / talk to neighbors for free'))
story.append(opt('(c) Something else:'))
story.append(answer_line())

story.append(q(2, 'Should Sleep / New Day be a button the player presses, or trigger automatically when Energy hits 0?'))
story.append(answer_line())

story.append(q(3, 'Should Happiness and Relationships meters be visible to the player in Stage 1, or tracked invisibly (communicated through character dialogue and world feedback)?'))
story.append(opt('(a) Fully visible meters'))
story.append(opt('(b) Invisible — communicated through characters and world'))
story.append(opt('(c) Partially visible (e.g. emoji / mood icon, not a number)'))
story.append(answer_line())

story.append(q(4, 'When Happiness gets low, what\'s the signal?'))
story.append(opt('(a) Character looks sad on screen'))
story.append(opt('(b) Neighbours comment on it'))
story.append(opt('(c) Gentle prompt from Grandpa'))
story.append(opt('(d) Visual change to the neighbourhood'))
story.append(opt('(e) Combination / other:'))
story.append(answer_line())

# --- Section 2 ---
story.append(section_header('🌳  Treehouse'))
story.append(Spacer(1, 4))

story.append(q(5, 'The 4 decoration options — any specific ideas, or should we pick them?'))
story.append(opt('(Examples: string lights, rug, telescope, flag, hammock, telescope, banner, beanbag…)'))
story.append(answer_line())

story.append(q(6, '"Invite a Friend Over" — does the player have named friends already in the neighbourhood, or do they meet friends through gameplay first?'))
story.append(opt('(a) Pre-existing named friends from the start'))
story.append(opt('(b) Meet friends through quests / exploration, then invite them'))
story.append(opt('(c) Other:'))
story.append(answer_line())

story.append(q(7, 'Learn With Grandpa lessons — what format feels right?'))
story.append(opt('(a) Text-based dialogue boxes'))
story.append(opt('(b) Illustrated story panels (like a mini comic)'))
story.append(opt('(c) Simple fill-in-the-blank / soft question'))
story.append(opt('(d) Combination:'))
story.append(answer_line())

# --- Section 3 ---
story.append(section_header('🚲  Bike'))
story.append(Spacer(1, 4))

story.append(q(8, 'Weekly Bike Race — what\'s the mechanic?'))
story.append(opt('(a) Mini-game (tap / swipe / timing)'))
story.append(opt('(b) Stat check (your bike stats vs. competitors)'))
story.append(opt('(c) Other:'))
story.append(answer_line())

story.append(q(9, 'Bike upgrades — what are they, and what do they affect?'))
story.append(opt('(Examples: faster tires, better brakes, cool paint job, basket for deliveries…)'))
story.append(opt('Do upgrades affect: race performance / delivery speed / both / cosmetic only?'))
story.append(answer_line())

story.append(q(10, 'Rainy-day bakery delivery (5 lemons → $10): can the player do multiple runs per rainy day, or just one?'))
story.append(opt('(a) One run per day'))
story.append(opt('(b) Multiple runs (each costs Energy)'))
story.append(opt('(c) Other:'))
story.append(answer_line())

# --- Section 4 ---
story.append(section_header('🎣  Pond & Collectibles'))
story.append(Spacer(1, 4))

story.append(q(11, 'What are the 5 items for Grandpa\'s quest? Any specific ideas, or should we design them?'))
story.append(opt('(Examples: rare fish, old coin, blue feather, smooth stone, wildflower…)'))
story.append(answer_line())

story.append(q(12, 'Fishing — mini-game or simple "spend 1 Energy, get a result"?'))
story.append(opt('(a) Mini-game (timing / tap mechanic)'))
story.append(opt('(b) Simple result (spend Energy, see outcome)'))
story.append(opt('(c) Other:'))
story.append(answer_line())

story.append(q(13, 'Do collectibles have any use beyond filling the Treehouse display, or is discovery the whole reward?'))
story.append(opt('(a) Display only — discovery is the reward'))
story.append(opt('(b) Some have trade / quest value'))
story.append(opt('(c) Other:'))
story.append(answer_line())

# --- Section 5 ---
story.append(section_header('💰  Economy'))
story.append(Spacer(1, 4))

story.append(q(14, 'Stand upgrade ($40, after ~15 days) — does the kid manually buy it, or does Grandpa prompt them when they\'re eligible?'))
story.append(opt('(a) Player-initiated purchase'))
story.append(opt('(b) Grandpa prompts when ready'))
story.append(opt('(c) Both options available'))
story.append(answer_line())

story.append(q(15, 'Second lemonade stand (after Grandpa quest) — does it run automatically with a hired helper each day, or does the player actively assign/manage it?'))
story.append(opt('(a) Runs automatically (hired helper always on)'))
story.append(opt('(b) Player assigns helper each day'))
story.append(opt('(c) Other:'))
story.append(answer_line())

story.append(q(16, 'Savings interest rate — your spec says 0.1–0.5% daily. What\'s the right number, and does it show as a daily drip or a weekly lump sum?'))
story.append(opt('Rate: ______%   Display: (a) daily drip  (b) weekly lump  (c) both'))
story.append(answer_line())

# --- Section 6 ---
story.append(section_header('👴  Grandpa & Characters'))
story.append(Spacer(1, 4))

story.append(q(17, 'Does Grandpa live somewhere specific on the map, or is he always available everywhere?'))
story.append(opt('(a) Lives at a specific house / spot on the map'))
story.append(opt('(b) Available everywhere (like a phone call / thought bubble)'))
story.append(opt('(c) Wanders / appears contextually'))
story.append(answer_line())

story.append(q(18, 'Are there named kid friends in Stage 1, or just adult neighbour characters (Tortoise, Bee, Fox)?'))
story.append(opt('If friends exist: how many? Do they have names already?'))
story.append(answer_line())

story.append(q(19, 'Should neighbours (Tortoise, Bee, Fox) give quests with real rewards in Stage 1, or mainly dialogue / advice?'))
story.append(opt('(a) Mainly advice / dialogue'))
story.append(opt('(b) Simple quests with rewards (coins, items)'))
story.append(opt('(c) Both — some give quests, some are advice-only'))
story.append(answer_line())

# --- Section 7 ---
story.append(section_header('📱  Platform & Polish'))
story.append(Spacer(1, 4))

story.append(q(20, 'Primary device for players?'))
story.append(opt('(a) Phone  (b) Tablet  (c) Desktop/laptop  (d) All of the above'))
story.append(answer_line())

story.append(q(21, 'Sound / music vision?'))
story.append(opt('(a) Cozy background music + sound effects'))
story.append(opt('(b) Sound effects only'))
story.append(opt('(c) Music only'))
story.append(opt('(d) Silence for now (add later)'))
story.append(answer_line())

story.append(q(22, 'Does the neighbourhood / town have a name yet?'))
story.append(answer_line())

story.append(q(23, 'Any other characters, mechanics, or details you want to lock in before we build?'))
story.append(answer_line())
story.append(Spacer(1, 0.15*inch))
story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#dddddd'), spaceAfter=8))
story.append(Paragraph('Thank you, Mike — this will make the build faster and closer to your vision.', note_style))

doc.build(story)
print(f'PDF written to {OUTPUT}')
