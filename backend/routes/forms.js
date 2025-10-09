import express from 'express';
import htmlGenerator from '../services/htmlGenerator.js';

const router = express.Router();

// HTML formos generavimas (POST /api/forms/generate)
router.post('/generate', async (req, res) => {
    try {
        console.log('Generuojama nauja HTML forma...');

        // Sugeneruoti HTML formą
        const result = await htmlGenerator.generatePartnerForm();

        if (result.success) {
            console.log('HTML forma sėkmingai sugeneruota:', result.fileName);
            res.json({
                success: true,
                formUrl: result.formUrl,
                fileName: result.fileName,
                message: result.message
            });
        } else {
            throw new Error(result.message || 'Nepavyko sugeneruoti formos');
        }

    } catch (error) {
        console.error('Formos generavimo klaida:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Nepavyko sugeneruoti HTML formos'
        });
    }
});

// Formų sąrašo gavimas (GET /api/forms)
router.get('/', async (req, res) => {
    try {
        const forms = await htmlGenerator.listForms();
        res.json({
            success: true,
            forms: forms,
            total: forms.length
        });
    } catch (error) {
        console.error('Formų sąrašo gavimo klaida:', error);
        res.status(500).json({
            success: false,
            error: 'Nepavyko gauti formų sąrašo'
        });
    }
});

// Formos ištrynimas (DELETE /api/forms/:fileName)
router.delete('/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        
        const result = await htmlGenerator.deleteForm(fileName);
        
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Formos ištrynimo klaida:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Nepavyko ištrinti formos'
        });
    }
});

export default router;
