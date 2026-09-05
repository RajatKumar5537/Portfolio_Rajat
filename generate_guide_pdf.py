import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        # Top banner line
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(36, 805, 559, 805)
        
        # Header text
        self.drawString(36, 810, "PERSONAL LABS — USER GUIDE & FEATURE MANUAL")
        self.drawRightString(559, 810, "https://personal-tracker-two-nu.vercel.app")
        
        # Bottom footer
        self.line(36, 40, 559, 40)
        self.setFont("Helvetica", 8)
        self.drawString(36, 28, "Private & Cloud-Synced on MongoDB Atlas • Multi-Device Access (Phone & Laptop)")
        self.drawRightString(559, 28, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf():
    pdf_path = "Personal_Labs_User_Guide.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=45,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    C_NAVY = colors.HexColor("#0f172a")
    C_INDIGO = colors.HexColor("#4338ca")
    C_TEAL = colors.HexColor("#0f766e")
    C_EMERALD = colors.HexColor("#059669")
    C_DARK = colors.HexColor("#1e293b")
    C_MUTED = colors.HexColor("#475569")
    C_BG_LIGHT = colors.HexColor("#f8fafc")
    C_BORDER = colors.HexColor("#cbd5e1")

    # Typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=C_NAVY,
        spaceAfter=2
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=C_INDIGO,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'DocBody',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=C_DARK
    )
    bullet_style = ParagraphStyle(
        'DocBullet',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=C_DARK,
        leftIndent=8,
        spaceAfter=2
    )

    story = []

    # 1. Header
    story.append(Paragraph("Personal Labs — All-in-One Growth & Life Tracker", title_style))
    story.append(Paragraph("Complete User Guide: How to Track Money, Nutrition, Learning & Habits", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_INDIGO, spaceBefore=0, spaceAfter=8))

    # 2. Key Benefits Banner
    benefits_data = [
        [
            Paragraph("<b>🌟 Why Use This Site? (Core Benefits)</b>", ParagraphStyle('BH', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor("#166534"))),
            Paragraph(
                "• <b>Total Financial Control</b>: Know where every rupee goes, prevent overspending with red budget alerts.<br/>"
                "• <b>Zero Manual Math</b>: Auto-calculates protein, macros, rolling savings & wealth compounding.<br/>"
                "• <b>100% Free & Cloud Synced</b>: Add entries on your mobile phone, view instantly on your laptop.",
                ParagraphStyle('BB', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#15803d"))
            )
        ]
    ]
    t_benefits = Table(benefits_data, colWidths=[145, 378])
    t_benefits.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#86efac")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_benefits)
    story.append(Spacer(1, 6))

    # Quick 3-Step Setup Box
    setup_data = [
        [
            Paragraph("<b>🚀 3-Step Setup</b>", ParagraphStyle('H', fontName='Helvetica-Bold', fontSize=8.5, textColor=C_TEAL)),
            Paragraph("<b>1. Open Link</b> in mobile browser", body_style),
            Paragraph("<b>2. Register</b> with your email", body_style),
            Paragraph("<b>3. Track & Sync</b> on phone & laptop", body_style),
        ]
    ]
    t_setup = Table(setup_data, colWidths=[110, 135, 135, 143])
    t_setup.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.75, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_setup)
    story.append(Spacer(1, 8))

    # Reusable Card Helper
    def create_module_card(title, nav_icon_label, bullets, highlight_bg=None, border_color=None):
        header_text = f"<b>{nav_icon_label} • {title}</b>"
        content = [
            [Paragraph(header_text, ParagraphStyle('MTitle', fontName='Helvetica-Bold', fontSize=10, textColor=C_NAVY))]
        ]
        for b in bullets:
            content.append([Paragraph(f"• {b}", bullet_style)])
        
        t = Table(content, colWidths=[523])
        bg = highlight_bg if highlight_bg else C_BG_LIGHT
        b_color = border_color if border_color else C_BORDER
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg),
            ('BOX', (0, 0), (-1, -1), 1, b_color),
            ('LINEBELOW', (0, 0), (-1, 0), 1, b_color),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        return t

    # 1. 💳 EXPENSES (TOP PRIORITY)
    story.append(create_module_card(
        "Smart Expense & Money Ledger (TOP PRIORITY)",
        "[ 💳 EXPENSES ]",
        [
            "<b>Daily Income & Expense Ledger</b>: Easily record your daily spending and salary/income with custom categories, dates, and notes.",
            "<b>Monthly Category Budgets & Crimson Red Alerts</b>: Set spending limits (e.g., Food, Room, Travel, Shopping). If spending exceeds the budget, the app triggers prominent <b>Crimson Red</b> warning alerts.",
            "<b>Automatic Rolling Savings</b>: Your leftover net balance from the previous month automatically carries forward into the new month's pool.",
            "<b>Wealth & Investments Hub</b>: Track your long-term SIP Mutual Funds, and optional company-matched Provident Fund (PF) and GMC Health Insurance.",
            "<b>1-Click Statement Export</b>: Instantly download full financial reports in <b>Excel (.xlsx)</b>, <b>CSV</b>, or print a formatted <b>PDF statement</b>."
        ],
        highlight_bg=colors.HexColor("#f8faff"),
        border_color=colors.HexColor("#818cf8")
    ))
    story.append(Spacer(1, 6))

    # 2. 🍎 FOOD LOG
    story.append(create_module_card(
        "Nutrition & Daily Protein Tracker",
        "[ 🍎 FOOD LOG ]",
        [
            "<b>Indian Food Dictionary</b>: Pre-configured database for Indian diets: <b>Milk, Sattu, Boiled Eggs, Chicken, Rice, Dalma, Paneer, Oats, Dates, Nuts, Poha</b>.",
            "<b>Auto-Calculated Macros</b>: Type your portion (e.g. 100g, 2 eggs, 1 bowl) and it instantly calculates <b>Protein, Calories, Carbs, and Fats</b>.",
            "<b>Milk Auto-Fill Routine</b>: Searching 'milk' offers 1-tap auto-fill for <b>₹10 Daily Pouch (200ml / 6.4g Prot)</b> & <b>Weekend Pouch (500ml / 16g Prot)</b>.",
            "<b>Sweet Cheat Treat Alerts</b>: Flags high-sugar items (&gt;10g) with red warning alerts to keep your diet disciplined."
        ],
        highlight_bg=colors.HexColor("#f0fdfa"),
        border_color=colors.HexColor("#5eead4")
    ))
    story.append(Spacer(1, 6))

    # 3. 📖 LEARNING
    story.append(create_module_card(
        "Study Hours & Skill Roadmap Tracker",
        "[ 📖 LEARNING ]",
        [
            "<b>Daily Study Log</b>: Track study sessions, topics covered, and total daily focus hours.",
            "<b>Visual Roadmap Milestones</b>: Build custom learning roadmaps with target dates and live completion progress bars.",
            "<b>Study Stopwatch</b>: Integrated persistent timer to track real-time study sessions."
        ]
    ))
    story.append(Spacer(1, 6))

    # 4. 🤍 WELLNESS
    story.append(create_module_card(
        "Sleep Quality & Daily Habit Routine",
        "[ 🤍 WELLNESS ]",
        [
            "<b>Sleep Tracker</b>: Log bedtime, wake-up time, and sleep quality recovery scores.",
            "<b>Daily Hydration</b>: Monitor your water intake and maintain health discipline."
        ]
    ))
    story.append(Spacer(1, 6))

    # 5. ⊞ DASHBOARD
    story.append(create_module_card(
        "Unified Multi-Metric Growth Hub",
        "[ ⊞ DASHBOARD ]",
        [
            "<b>All-in-One Snapshot</b>: View Net Savings, Protein Intake, Study Hours, and Sleep Score on a single screen.",
            "<b>Consistency Streaks</b>: Visual rings and progress trackers to keep you motivated every day."
        ]
    ))
    story.append(Spacer(1, 8))

    # Security & Cloud Sync Box
    sec_data = [
        [
            Paragraph("<b>🔒 100% Private, Cloud-Synced & Encrypted</b>", ParagraphStyle('ST', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor("#581c87"))),
            Paragraph(
                "All data is stored in <b>MongoDB Atlas</b> with AES-256 encryption. Each user account is completely private and isolated. "
                "Log in from your phone, laptop, or tablet anytime.",
                ParagraphStyle('SB', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#6b21a8"))
            )
        ]
    ]
    t_sec = Table(sec_data, colWidths=[175, 348])
    t_sec.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#faf5ff")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#d8b4fe")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_sec)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at {pdf_path}")

if __name__ == '__main__':
    build_pdf()
