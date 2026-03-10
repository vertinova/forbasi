<?php
// partials/activity_log_table.php
if (!empty($activity_log_data)): ?>
    <table class="kta-table">
        <thead>
            <tr>
                <th>Waktu</th>
                <th>Tipe Aktivitas</th>
                <th>Deskripsi</th>
                <th>ID Pengajuan KTA</th>
                <th>Status Lama</th>
                <th>Status Baru</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($activity_log_data as $log): ?>
                <tr>
                    <td><?php echo htmlspecialchars($log['created_at']); ?></td>
                    <td><?php echo htmlspecialchars($log['activity_type']); ?></td>
                    <td><?php echo htmlspecialchars($log['description']); ?></td>
                    <td><?php echo $log['application_id'] ? htmlspecialchars($log['application_id']) . ' (' . htmlspecialchars($log['application_club_name']) . ')' : 'N/A'; ?></td>
                    <td><?php echo $log['old_status'] ? htmlspecialchars(ucfirst(str_replace('_', ' ', $log['old_status']))) : 'N/A'; ?></td>
                    <td><?php echo $log['new_status'] ? htmlspecialchars(ucfirst(str_replace('_', ' ', $log['new_status']))) : 'N/A'; ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
<?php else: ?>
    <p>Tidak ada riwayat aktivitas.</p>
<?php endif; ?>