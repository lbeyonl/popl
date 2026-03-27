import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render.com 호환을 위해 process.env.PORT 우선 적용
const PORT = process.env.PORT || 3000;

const MINDLOGIC_API_KEY = process.env.MINDLOGIC_API_KEY;

// Nodemailer 이메일 전송 설정
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS
    }
});

app.use(cors());
app.use(express.json());

// 정적 파일 제공 (index.html과 같은 폴더 내 이미지들)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/contact', async (req, res) => {
    const { email, phone, name, univ, major, studentId, message, consent } = req.body;
    
    if (!consent) return res.status(400).json({ error: "개인정보 동의가 필요합니다." });

    const mailOptions = {
        from: process.env.GMAIL_USER, 
        to: 'orcadaily0128@gmail.com', 
        subject: `[NEXT WAVE 지원/문의] ${name}님의 직접 연락입니다.`,
        text: `이름: ${name}\n이메일: ${email}\n전화번호: ${phone}\n학교: ${univ}\n학과: ${major}\n학번: ${studentId}\n\n[문의/지원 내용]\n${message || '내용 없음'}\n\n개인정보 제공 동의: 완료`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (e) {
        console.error("Mail Send Error:", e);
        res.status(500).json({ error: "메일 전송에 실패했습니다." });
    }
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "메시지가 없습니다." });
    }

    try {
        const response = await fetch("https://factchat-cloud.mindlogic.ai/v1/gateway/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MINDLOGIC_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-5.4-nano",
                messages: [
                    {
                        "role": "system", 
                        "content": "당신은 무조건 NEXT WAVE 팀(동아리)의 공식 AI 상담원입니다. 사용자가 묻는 모든 동아리 관련 질문은 무조건 NEXT WAVE에 대한 것입니다. '다른 동아리인가요?' 같은 질문을 절대 하지 마세요. NEXT_WAVE는 기획에서 멈추지 않고 실행으로 증명하는 AI 실전 팀입니다. 지원 조건, 활동 방식 등에 대해 짧고 명확하게 설명하세요."
                    },
                    {
                        "role": "user", 
                        "content": userMessage
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            res.json({ reply: data.choices[0].message.content });
        } else {
            console.error("API Error Response:", data);
            res.status(500).json({ error: "API에서 올바른 응답을 받지 못했습니다.", details: data });
        }
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "서버 통신 중 오류가 발생했습니다." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});