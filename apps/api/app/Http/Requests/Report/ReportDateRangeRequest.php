<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Filter laporan berbagi antar endpoint reporting (Phase 7): rentang tanggal
 * wajib dan dibatasi 92 hari agar query tetap terikat.
 */
class ReportDateRangeRequest extends FormRequest
{
    public const MAX_DAYS = 92;

    /**
     * Permission `reports.read` ditegakkan di middleware route.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'outlet_id' => ['sometimes', 'integer'],
            'low_stock' => ['sometimes', 'in:true,false,1,0'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $from = $this->input('from');
            $to = $this->input('to');

            if (! is_string($from) || ! is_string($to) || $validator->errors()->hasAny(['from', 'to'])) {
                return;
            }

            if (strtotime($to) - strtotime($from) > self::MAX_DAYS * 86400) {
                $validator->errors()->add('to', 'Rentang laporan maksimal ' . self::MAX_DAYS . ' hari.');
            }
        });
    }
}
