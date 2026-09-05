import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
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
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Top banner line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(40, 800, 555, 800)
        
        # Header text
        self.drawString(40, 805, "Personal Labs — Growth & Daily Life Tracker User Guide")
        self.drawRightString(555, 805, "https://personal-tracker-two-nu.vercel.app")
        
        # Bottom footer
        self.line(40, 45, 555, 45)
        self.drawString(40, 32, "Confidential & Private • Cloud-Synced on MongoDB Atlas")
        self.drawRightString(555, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf():
    pdf_path = "Personal_Labs_User_Guide.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=55,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    C_NAVY = colors.HexColor("#0f172a")
    C_INDIGO = colors.HexColor("#4f46e5")
    C_TEAL = colors.HexColor("#0d9488")
    C_EMERALD = colors.HexColor("#10b981")
    C_ROSE = colors.HexColor("#e11d48")
    C_DARK = colors.HexColor("#1e293b")
    C_MUTED = colors.HexColor("#64748b")
    C_BG_LIGHT = colors.HexColor("#f8fafc")
    C_BORDER = colors.HexColor("#e2e8f0")

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=C_NAVY,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=C_MUTED,
        spaceAfter=12
    )
    section_title_style = ParagraphStyle(
        'SectionTitle',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=C_INDIGO,
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=C_DARK
    )
    body_bold = ParagraphStyle(
        'DocBodyBold',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=C_NAVY
    )
    bullet_style = ParagraphStyle(
        'DocBullet',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=C_DARK,
        leftIndent=10,
        spaceAfter=3
    )

    story = []

    # 1. Main Header Title
    story.append(Paragraph("🌟 Personal Labs — Growth & Daily Tracker", title_style))
    story.append(Paragraph("Complete Feature Guide & How-To Manual for Friends & Onboarding", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_INDIGO, spaceBefore=0, spaceAfter=12))

    # 2. Quick Setup Banner
    setup_data = [
        [
            Paragraph("<b>🚀 3-Step Quick Start</b>", ParagraphStyle('H', fontName='Helvetica-Bold', fontSize=10, textColor=C_TEAL)),
            Paragraph("<b>Step 1:</b> Open on Mobile/PC<br/><font color='#64748b'>No app install required</font>", body_style),
            Paragraph("<b>Step 2:</b> Free Registration<br/><font color='#64748b'>Create account with Email</font>", body_style),
            Paragraph("<b>Step 3:</b> Track Anywhere<br/><font color='#64748b'>100% Cloud-Synced</font>", body_style),
        ]
    ]
    t_setup = Table(setup_data, colWidths=[130, 125, 125, 135])
    t_setup.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#86efac")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#bbf7d0")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_setup)
    story.append(Spacer(1, 12))

    # 3. Features Section Table Cards
    def create_feature_box(title, icon_text, bullets):
        content = [
            [
                Paragraph(f"<b>{icon_text} {title}</b>", ParagraphStyle('FTitle', fontName='Helvetica-Bold', fontSize=10.5, textColor=C_NAVY)),
            ]
        ]
        for b in bullets:
            content.append([Paragraph(f"• {b}", bullet_style)])
        
        t = Table(content, colWidths=[515])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 1, C_BORDER),
            ('LINEBELOW', (0, 0), (-1, 0), 1, C_BORDER),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        return t

    # Module 1: Money
    story.append(create_feature_box(
        "Module 1: Smart Expense & Money Ledger",
        "💰",
        [
            "<b>Daily Transactions</b>: Log Income and Expenses with date, category, and notes.",
            "<b>Budget Limits & Crimson Red Alerts</b>: Set monthly limits on categories (Food, Travel, Room). Exceeding budget triggers immediate red visual warnings.",
            "<b>Rolling Net Savings</b>: Leftover savings from previous months automatically roll over into your new month's pool.",
            "<b>Wealth & PF Hub</b>: Track Mutual Funds (SIP), Locked Provident Fund, and Corporate Health Insurance.",
            "<b>1-Click Export</b>: Download full statements in <b>Excel (.xlsx)</b>, <b>CSV</b>, or Print formatted <b>PDF</b>."
        ]
    ))
    story.append(Spacer(1, 10))

    # Module 2: Nutrition
    story.append(create_feature_box(
        "Module 2: Daily Nutrition & Protein Tracker",
        "🥗",
        [
            "<b>Smart Indian Food Dictionary</b>: Pre-loaded nutritional profiles (Milk, Sattu, Eggs, Chicken, Rice, Dalma, Paneer, Oats, Poha).",
            "<b>Automatic Macro Calculations</b>: Auto-computes Protein, Carbs, Fats, and Calories as you type your portion size.",
            "<b>Milk Quick-Fill Routine</b>: Auto-fills <b>₹10 Daily Pouch (200ml / 6.4g Prot)</b> and <b>Weekend Pouch (500ml / 16g Prot)</b> with 1-tap toggles.",
            "<b>Sweet & Sugar Cheat Warnings</b>: Alerts you whenever sweet items exceed 10g portion to protect your fitness discipline."
        ]
    ))
    story.append(Spacer(1, 10))

    # Module 3: Study
    story.append(create_feature_box(
        "Module 3: Study Hours & Skill Roadmap Tracker",
        "📚",
        [
            "<b>Daily Study Duration</b>: Log daily study hours, subjects, and topics covered.",
            "<b>Visual Learning Milestones</b>: Create custom roadmap roadmaps with target completion dates and real-time progress bars.",
            "<b>Analytics & Streaks</b>: Monitor consistency trends and weekly learning averages."
        ]
    ))
    story.append(Spacer(1, 10))

    # Module 4: Wellness
    story.append(create_feature_box(
        "Module 4: Wellness & Daily Habit Routine",
        "🌿",
        [
            "<b>Sleep Quality Tracker</b>: Record sleep duration, bedtime, wake-up times, and recovery ratings.",
            "<b>Hydration & Habit Logs</b>: Stay accountable for daily water intake and wellness routines."
        ]
    ))
    story.append(Spacer(1, 10))

    # Module 5: Secret Chat & Calling
    story.append(create_feature_box(
        "Module 5: Secret Peer-to-Peer Chat & Voice/Video Calling",
        "💬",
        [
            "<b>Private Messaging</b>: Add friends by email for real-time encrypted conversations.",
            "<b>Free Browser Voice & Video Calling</b>: High-definition WebRTC peer-to-peer audio and video calling without installing third-party apps.",
            "<b>Online Presence & Unread Badges</b>: Real-time active indicators and message notification badges."
        ]
    ))
    story.append(Spacer(1, 12))

    # 4. Security & Cloud Sync Box
    sec_data = [
        [
            Paragraph("<b>🔒 Cloud-Synced & Encrypted Guarantee</b>", ParagraphStyle('ST', fontName='Helvetica-Bold', fontSize=9.5, textColor=colors.HexColor("#581c87"))),
            Paragraph(
                "All data is stored securely in <b>MongoDB Atlas</b> with AES-256 encryption. "
                "Every user account is completely isolated. Changes made on your mobile phone update instantly on your laptop.",
                ParagraphStyle('SB', fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor("#6b21a8"))
            )
        ]
    ]
    t_sec = Table(sec_data, colWidths=[160, 355])
    t_sec.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#faf5ff")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#d8b4fe")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_sec)

    # Build PDF with Page Numbers
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at {pdf_path}")

if __name__ == '__main__':
    build_pdf()
